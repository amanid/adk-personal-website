-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'VOID', 'CASHED_OUT');

-- CreateTable
CREATE TABLE "TradeAuditLog" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "instrument" TEXT,
    "units" TEXT,
    "request" JSONB NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "response" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetEntry" (
    "id" TEXT NOT NULL,
    "bookmaker" TEXT NOT NULL,
    "sport" TEXT,
    "event" TEXT NOT NULL,
    "market" TEXT,
    "selection" TEXT NOT NULL,
    "oddsMilli" INTEGER NOT NULL,
    "stakeCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" "BetStatus" NOT NULL DEFAULT 'OPEN',
    "returnCents" INTEGER,
    "notes" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradeAuditLog_createdAt_idx" ON "TradeAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "BetEntry_placedAt_idx" ON "BetEntry"("placedAt");

-- CreateIndex
CREATE INDEX "BetEntry_bookmaker_status_idx" ON "BetEntry"("bookmaker", "status");

