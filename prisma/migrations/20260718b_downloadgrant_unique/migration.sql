-- Prevent duplicate download grants (race between capture and webhook).
-- CreateIndex
CREATE UNIQUE INDEX "DownloadGrant_orderId_bookId_key" ON "DownloadGrant"("orderId", "bookId");
