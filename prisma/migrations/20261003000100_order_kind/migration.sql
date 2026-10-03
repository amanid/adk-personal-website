-- CreateEnum
CREATE TYPE "OrderKind" AS ENUM ('STORE', 'BOOKING', 'QUOTE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "kind" "OrderKind" NOT NULL DEFAULT 'STORE';

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "bookId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_kind_status_idx" ON "Order"("kind", "status");

