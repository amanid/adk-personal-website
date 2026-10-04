-- AlterTable
ALTER TABLE "BookAsset" ADD COLUMN     "complete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parts" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "data" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BookAssetPart" (
    "assetId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "BookAssetPart_pkey" PRIMARY KEY ("assetId","index")
);

-- CreateIndex
CREATE INDEX "BookAsset_complete_createdAt_idx" ON "BookAsset"("complete", "createdAt");

-- AddForeignKey
ALTER TABLE "BookAssetPart" ADD CONSTRAINT "BookAssetPart_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "BookAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

