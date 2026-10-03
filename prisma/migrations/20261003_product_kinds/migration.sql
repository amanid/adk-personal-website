-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('BOOK', 'REPORT', 'DATASET', 'TEMPLATE', 'TOOLKIT', 'COURSE');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "kind" "ProductKind" NOT NULL DEFAULT 'BOOK';

-- CreateIndex
CREATE INDEX "Book_kind_status_idx" ON "Book"("kind", "status");

