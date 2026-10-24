-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "PromoEvent" (
    "id" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "itemKind" TEXT NOT NULL,
    "itemSlug" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoEvent_createdAt_idx" ON "PromoEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PromoEvent_placement_event_idx" ON "PromoEvent"("placement", "event");

-- CreateIndex
CREATE INDEX "Order_source_idx" ON "Order"("source");
