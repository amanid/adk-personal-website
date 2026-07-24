-- Mobile-money (Wave/Djamo/Orange Money) support alongside PayPal.
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYPAL', 'WAVE', 'DJAMO', 'ORANGE_MONEY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYPAL',
ADD COLUMN     "paymentReference" TEXT;
