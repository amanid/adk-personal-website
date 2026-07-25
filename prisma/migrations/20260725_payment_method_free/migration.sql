-- Support free orders (price 0) that need no payment.
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'FREE';
