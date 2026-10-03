-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DEPOSIT_PAID', 'BALANCE_DUE', 'PAID', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuoteStage" AS ENUM ('DEPOSIT', 'BALANCE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "quoteStage" "QuoteStage";

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "company" TEXT,
    "title" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalCents" INTEGER NOT NULL,
    "depositPercent" INTEGER NOT NULL,
    "depositCents" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "internalNotes" TEXT,
    "serviceRequestId" TEXT,
    "acceptedName" TEXT,
    "acceptedIp" TEXT,
    "declineReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "depositPaidAt" TIMESTAMP(3),
    "balanceRequestedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_token_key" ON "Quote"("token");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_clientEmail_idx" ON "Quote"("clientEmail");

-- CreateIndex
CREATE INDEX "Order_quoteId_idx" ON "Order"("quoteId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

