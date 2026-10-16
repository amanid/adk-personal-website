/**
 * Per-buyer licence stamp for PDF downloads, without loading the PDF.
 *
 * A PDF may be extended by an "incremental update": bytes appended after the
 * original that add or replace objects and end with a new cross-reference
 * section pointing back (/Prev) at the old one. We append one that replaces
 * the document information dictionary with the buyer's name, email and order
 * number. Every reader shows it under Document Properties, and it travels with
 * any copy of the file, so a leaked copy names its source.
 *
 * Only the last cross-reference section is read (a few KB near the end), so a
 * 50MB book is still streamed piece by piece on the 512MB host. Anything
 * unexpected (encrypted file, unparsable trailer) returns null and the
 * original file is served unchanged — a download must never break.
 */

export interface LicenceInfo {
  title: string;
  author: string;
  buyerEmail: string;
  buyerName?: string | null;
  orderNumber: string;
  date?: Date;
}

/** Reads `length` bytes at absolute `offset` (clamped to the file). */
export type ReadRange = (offset: number, length: number) => Promise<Buffer>;

const latin1 = (b: Buffer) => b.toString("latin1");

/** A PDF text string as UTF-16BE hex, which is safe for any character. */
function pdfText(s: string): string {
  const units: number[] = [0xfe, 0xff];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    units.push(c >> 8, c & 0xff);
  }
  return `<${Buffer.from(units).toString("hex").toUpperCase()}>`;
}

function pdfDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `(D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z)`;
}

interface Trailer {
  size: number;
  root: string;
  id: string | null;
  /** Whether the newest section is a cross-reference stream (PDF 1.5+). */
  stream: boolean;
}

function parseTrailerDict(dict: string, stream: boolean): Trailer | null {
  if (/\/Encrypt\b/.test(dict)) return null; // strings would need encrypting
  const size = dict.match(/\/Size\s+(\d+)/);
  const root = dict.match(/\/Root\s+(\d+\s+\d+\s+R)/);
  if (!size || !root) return null;
  const id = dict.match(/\/ID\s*(\[[^\]]*\])/);
  return { size: Number(size[1]), root: root[1].replace(/\s+/g, " "), id: id ? id[1] : null, stream };
}

/** Locate and parse the newest trailer. */
async function readTrailer(fileSize: number, read: ReadRange): Promise<{ trailer: Trailer; prev: number } | null> {
  const tailLen = Math.min(fileSize, 64 * 1024);
  const tail = latin1(await read(fileSize - tailLen, tailLen));
  const sx = tail.lastIndexOf("startxref");
  if (sx < 0) return null;
  const m = tail.slice(sx).match(/^startxref\s+(\d+)/);
  if (!m) return null;
  const prev = Number(m[1]);
  if (!Number.isSafeInteger(prev) || prev <= 0 || prev >= fileSize) return null;

  const head = latin1(await read(prev, 64));
  if (/^\s*xref\b/.test(head)) {
    // Classic table: its trailer dictionary sits just before startxref.
    const tr = tail.lastIndexOf("trailer", sx);
    if (tr < 0) return null;
    const trailer = parseTrailerDict(tail.slice(tr, sx), false);
    return trailer ? { trailer, prev } : null;
  }
  if (/^\s*\d+\s+\d+\s+obj\b/.test(head)) {
    // Cross-reference stream: the trailer keys are in the stream's dictionary.
    const obj = latin1(await read(prev, 4096));
    const end = obj.indexOf("stream");
    if (end < 0 || !/\/Type\s*\/XRef\b/.test(obj.slice(0, end))) return null;
    const trailer = parseTrailerDict(obj.slice(0, end), true);
    return trailer ? { trailer, prev } : null;
  }
  return null;
}

/**
 * The bytes to append to a PDF of `fileSize` bytes, or null to serve it as is.
 */
export async function buildLicenceUpdate(fileSize: number, read: ReadRange, info: LicenceInfo): Promise<Buffer | null> {
  let found: Awaited<ReturnType<typeof readTrailer>>;
  try {
    found = await readTrailer(fileSize, read);
  } catch {
    return null;
  }
  if (!found) return null;
  const { trailer, prev } = found;

  const who = info.buyerName ? `${info.buyerName} <${info.buyerEmail}>` : info.buyerEmail;
  const notice = `Licensed to ${who} · Order ${info.orderNumber} · Personal use only, not for redistribution`;
  const infoNum = trailer.size;
  const infoObj =
    `${infoNum} 0 obj\n<< /Title ${pdfText(info.title)} /Author ${pdfText(info.author)}` +
    ` /Subject ${pdfText(notice)} /Keywords ${pdfText(`licence; order ${info.orderNumber}; ${info.buyerEmail}`)}` +
    ` /ModDate ${pdfDate(info.date ?? new Date())} >>\nendobj\n`;

  // Start on a fresh line after whatever the file ends with.
  const lead = "\n";
  const infoOffset = fileSize + lead.length;
  const xrefOffset = infoOffset + Buffer.byteLength(infoObj, "latin1");
  const id = trailer.id ? ` /ID ${trailer.id}` : "";

  let xref: string | Buffer;
  if (!trailer.stream) {
    const entry = (off: number) => `${String(off).padStart(10, "0")} 00000 n\r\n`;
    xref =
      `xref\n${infoNum} 1\n${entry(infoOffset)}` +
      `trailer\n<< /Size ${infoNum + 1} /Root ${trailer.root} /Info ${infoNum} 0 R /Prev ${prev}${id} >>\n` +
      `startxref\n${xrefOffset}\n%%EOF\n`;
  } else {
    // Answer a stream with a stream: an uncompressed one listing the info
    // object and itself. Rows are [type:1][offset:4][generation:2].
    if (xrefOffset > 0xffffffff) return null;
    const xrefNum = infoNum + 1;
    const rows = Buffer.alloc(14);
    rows.writeUInt8(1, 0);
    rows.writeUInt32BE(infoOffset, 1);
    rows.writeUInt16BE(0, 5);
    rows.writeUInt8(1, 7);
    rows.writeUInt32BE(xrefOffset, 8);
    rows.writeUInt16BE(0, 12);
    const dict =
      `${xrefNum} 0 obj\n<< /Type /XRef /Size ${xrefNum + 1} /Index [${infoNum} 2] /W [1 4 2]` +
      ` /Root ${trailer.root} /Info ${infoNum} 0 R /Prev ${prev}${id} /Length ${rows.length} >>\nstream\n`;
    xref = Buffer.concat([
      Buffer.from(dict, "latin1"),
      rows,
      Buffer.from(`\nendstream\nendobj\nstartxref\n${xrefOffset}\n%%EOF\n`, "latin1"),
    ]);
  }

  return Buffer.concat([Buffer.from(lead + infoObj, "latin1"), typeof xref === "string" ? Buffer.from(xref, "latin1") : xref]);
}
