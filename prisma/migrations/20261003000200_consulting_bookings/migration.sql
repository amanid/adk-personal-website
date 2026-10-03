-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'RESCHEDULE_NEEDED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ServicePackage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleFr" TEXT,
    "description" TEXT NOT NULL,
    "descriptionFr" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedPeriod" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "holdExpiresAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "notes" TEXT,
    "clientTimezone" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "manageToken" TEXT NOT NULL,
    "meetingUrl" TEXT,
    "orderId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServicePackage_slug_key" ON "ServicePackage"("slug");

-- CreateIndex
CREATE INDEX "ServicePackage_active_sortOrder_idx" ON "ServicePackage"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "AvailabilityRule_weekday_idx" ON "AvailabilityRule"("weekday");

-- CreateIndex
CREATE INDEX "BlockedPeriod_startsAt_endsAt_idx" ON "BlockedPeriod"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_manageToken_key" ON "Booking"("manageToken");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_orderId_key" ON "Booking"("orderId");

-- CreateIndex
CREATE INDEX "Booking_startsAt_endsAt_idx" ON "Booking"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_email_idx" ON "Booking"("email");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Seed the two bookable sessions already advertised on the consulting page
-- (same names, lengths and prices). Idempotent; edit them in Admin → Bookings.
INSERT INTO "ServicePackage" ("id", "slug", "title", "titleFr", "description", "descriptionFr", "durationMinutes", "priceCents", "currency", "active", "sortOrder", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'discovery-call', 'Discovery Call', 'Appel Découverte',
   'A 30-minute introductory call to discuss your needs and explore how I can help.',
   'Un appel de 30 minutes pour discuter de vos besoins et explorer comment je peux vous aider.',
   30, 0, 'USD', true, 0, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'expert-advisory', 'Expert Advisory', 'Conseil Expert',
   'Focused expert sessions for specific technical challenges, architecture reviews, or strategic guidance.',
   'Sessions d''expertise ciblées pour des défis techniques, revues d''architecture ou guidance stratégique.',
   60, 15000, 'USD', true, 1, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
