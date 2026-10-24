import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
// Somewhere durable — not a session temp dir that gets swept away.
const BACKUP_DIR = join(homedir(), "adk-orphan-backup-2026-09-05");
const p = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// pg_column_size reads the toast pointer, not the payload — unlike length(data),
// which detoasts every multi-megabyte row just to count bytes.
const orphanAssets = await p.$queryRawUnsafe(`
  SELECT a.id, a.filename, a.size, a."createdAt"
  FROM "BookAsset" a
  WHERE NOT EXISTS (SELECT 1 FROM "Book" b WHERE b."fileId" = a.id)
  ORDER BY a."createdAt"`);

const orphanUploads = await p.$queryRawUnsafe(`
  SELECT u.id, u.filename, u."mimeType", pg_column_size(u.data) AS len, u."createdAt"
  FROM "Upload" u
  WHERE NOT EXISTS (SELECT 1 FROM "Book" b        WHERE b."coverImageId" = u.id)
    AND NOT EXISTS (SELECT 1 FROM "User" x        WHERE x.image        = u.id)
    AND NOT EXISTS (SELECT 1 FROM "BlogPost" x    WHERE x."coverImage" = u.id)
    AND NOT EXISTS (SELECT 1 FROM "Project" x     WHERE x."coverImage" = u.id)
    AND NOT EXISTS (SELECT 1 FROM "Experience" x  WHERE x.logo         = u.id)
    AND NOT EXISTS (SELECT 1 FROM "Publication" x WHERE x."pdfUrl"     = u.id)
  ORDER BY u."createdAt"`);
console.log(`candidates: ${orphanAssets.length} BookAsset, ${orphanUploads.length} Upload`);

const ids = [...orphanAssets.map(a => a.id), ...orphanUploads.map(u => u.id)];
if (ids.length === 0) { console.log("nothing to do"); await p.$disconnect(); process.exit(0); }

// One query, not one-per-column: ask every text column in the database at once
// whether it mentions any candidate id (uploads get embedded in rich text as
// /api/uploads/<id>, which no foreign key can see).
const cols = await p.$queryRawUnsafe(`
  SELECT table_name t, column_name c FROM information_schema.columns
  WHERE table_schema='public' AND data_type IN ('text','character varying')
    AND NOT (table_name IN ('Upload','BookAsset') AND column_name='id')`);
console.log(`sweeping ${cols.length} text columns in one pass…`);

const union = cols.map(({ t, c }) =>
  `SELECT '${t}.${c}' AS loc, x.id AS ref FROM "${t}" v CROSS JOIN unnest($1::text[]) x(id) WHERE v."${c}" LIKE '%' || x.id || '%'`
).join(" UNION ALL ");
const hits = await p.$queryRawUnsafe(`SELECT DISTINCT loc, ref FROM (${union}) q`, ids);

const referenced = new Map();
for (const h of hits) {
  if (!referenced.has(h.ref)) referenced.set(h.ref, []);
  referenced.get(h.ref).push(h.loc);
}

const safeAssets = orphanAssets.filter(a => !referenced.has(a.id));
const safeUploads = orphanUploads.filter(u => !referenced.has(u.id));

console.log("\nDELETABLE:");
safeAssets.forEach(a => console.log(`  BookAsset ${a.id}  ${(Number(a.size)/1048576).toFixed(1)}MB  ${a.createdAt.toISOString()}`));
safeUploads.forEach(u => console.log(`  Upload    ${u.id}  ${(Number(u.len)/1024).toFixed(0)}KB  ${u.mimeType}  ${u.createdAt.toISOString()}`));

if (referenced.size) {
  console.log("\nKEEPING (id appears in prose / an /api/uploads link):");
  for (const [ref, locs] of referenced) console.log(`  ${ref} — ${locs.join(", ")}`);
}

const freed = safeAssets.reduce((s,a)=>s+Number(a.size),0) + safeUploads.reduce((s,u)=>s+Number(u.len),0);
console.log(`\ntotal: ${safeAssets.length + safeUploads.length} rows, ${(freed/1048576).toFixed(1)}MB`);

if (!APPLY) console.log("\nDRY RUN — nothing deleted.\n");
else {
  // Write every row to disk BEFORE deleting anything, so this is reversible.
  await mkdir(BACKUP_DIR, { recursive: true });
  const manifest = [];
  for (const x of safeAssets) {
    const row = await p.bookAsset.findUnique({ where: { id: x.id } });
    if (!row) continue;
    await writeFile(`${BACKUP_DIR}/BookAsset-${row.id}-${row.filename}`, Buffer.from(row.data));
    manifest.push({ table: "BookAsset", id: row.id, filename: row.filename,
                    mimeType: row.mimeType, size: row.size, createdAt: row.createdAt });
  }
  for (const x of safeUploads) {
    const row = await p.upload.findUnique({ where: { id: x.id } });
    if (!row) continue;
    await writeFile(`${BACKUP_DIR}/Upload-${row.id}-${row.filename}`, Buffer.from(row.data));
    manifest.push({ table: "Upload", id: row.id, filename: row.filename,
                    mimeType: row.mimeType, createdAt: row.createdAt });
  }
  await writeFile(`${BACKUP_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`\nbacked up ${manifest.length} rows to ${BACKUP_DIR}`);

  if (manifest.length !== safeAssets.length + safeUploads.length) {
    console.log("BACKUP INCOMPLETE — refusing to delete.");
    await p.$disconnect();
    process.exit(1);
  }

  const a = await p.bookAsset.deleteMany({ where: { id: { in: safeAssets.map(x=>x.id) } } });
  const u = await p.upload.deleteMany({ where: { id: { in: safeUploads.map(x=>x.id) } } });
  console.log(`DELETED ${a.count} BookAsset, ${u.count} Upload rows.\n`);
}
await p.$disconnect();
