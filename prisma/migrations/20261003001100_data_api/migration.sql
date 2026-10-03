-- CreateEnum
CREATE TYPE "ApiPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "useCase" TEXT,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "manageToken" TEXT NOT NULL,
    "plan" "ApiPlan" NOT NULL DEFAULT 'FREE',
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "paypalSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "keyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("keyId","period")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_manageToken_key" ON "ApiKey"("manageToken");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_paypalSubscriptionId_key" ON "ApiKey"("paypalSubscriptionId");

-- CreateIndex
CREATE INDEX "ApiKey_email_idx" ON "ApiKey"("email");

-- AddForeignKey
ALTER TABLE "ApiUsage" ADD CONSTRAINT "ApiUsage_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

