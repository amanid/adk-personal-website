-- Track email delivery status per order so admins can see failures.
ALTER TABLE "Order" ADD COLUMN     "invoiceEmailedAt" TIMESTAMP(3),
ADD COLUMN     "receiptEmailedAt" TIMESTAMP(3),
ADD COLUMN     "lastEmailError" TEXT;
