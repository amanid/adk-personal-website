-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'VOID');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "affiliateId" TEXT;

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'PENDING',
    "commissionPercent" INTEGER NOT NULL,
    "website" TEXT,
    "pitch" TEXT,
    "payoutMethod" TEXT,
    "payoutDetails" TEXT,
    "dashboardToken" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateCommission" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "holdUntil" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_email_key" ON "Affiliate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_code_key" ON "Affiliate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_dashboardToken_key" ON "Affiliate"("dashboardToken");

-- CreateIndex
CREATE INDEX "Affiliate_status_idx" ON "Affiliate"("status");

-- CreateIndex
CREATE INDEX "AffiliateClick_affiliateId_createdAt_idx" ON "AffiliateClick"("affiliateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCommission_orderId_key" ON "AffiliateCommission"("orderId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_status_idx" ON "AffiliateCommission"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "Order_affiliateId_idx" ON "Order"("affiliateId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

