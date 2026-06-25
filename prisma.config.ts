import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Migrated from the deprecated `package.json#prisma` block (removed in Prisma 7).
// Note: with a Prisma config file present, the CLI no longer auto-loads `.env`
// (`@prisma/config` sets `dotenv: false`), so we import "dotenv/config" above to
// keep `env("DATABASE_URL")` working for `migrate`/`db seed`/`generate`.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    // Was: package.json#prisma.seed
    seed: "npx tsx prisma/seed.ts",
  },
});
