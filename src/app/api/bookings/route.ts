import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingRequestSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { sanitizeInput } from "@/lib/sanitize";
import { getBookingSettings, reserveSlot, SlotUnavailableError } from "@/lib/booking";
import { createOrderRecord, notifyManualOrder, startPayPalPayment } from "@/lib/orders";
import { sendBookingConfirmation } from "@/lib/booking-notify";
import { voidUnpaidOrder, emitBookingConfirmed } from "@/lib/order-fulfillment";
import { isPaypalCurrency } from "@/lib/currency";

export const runtime = "nodejs";

/**
 * Book a consulting session.
 *
 * The slot is re-validated and reserved under a lock (lib/booking), and the
 * price always comes from the package in the database. Then, by payment:
 *   FREE    — zero-price packages only: confirmed immediately.
 *   PAYPAL  — slot held briefly; returns the PayPal order to approve. Capture
 *             goes through /api/store/capture, which confirms the booking.
 *   MANUAL  — mobile money / direct PayPal transfer: slot held until the admin
 *             confirms the payment (or the hold lapses).
 */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const limited = rateLimit(request, { limit: 10, windowSeconds: 60 });
  if (limited) return limited;

  try {
    const parsed = bookingRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const input = parsed.data;
    const pkg = await prisma.servicePackage.findFirst({ where: { slug: input.packageSlug, active: true } });
    if (!pkg) return NextResponse.json({ error: "This session is no longer offered." }, { status: 404 });

    const isFree = pkg.priceCents === 0;
    if (isFree !== (input.payment === "FREE")) {
      return NextResponse.json({ error: "Invalid payment method for this session." }, { status: 400 });
    }
    if (input.payment === "MANUAL" && !input.provider) {
      return NextResponse.json({ error: "Choose how you will pay." }, { status: 400 });
    }
    if (input.payment === "PAYPAL" && !isPaypalCurrency(pkg.currency)) {
      return NextResponse.json({ error: "PayPal can't settle this currency." }, { status: 400 });
    }

    const settings = await getBookingSettings();
    const locale = input.locale === "fr" ? "fr" : "en";
    const client = {
      name: sanitizeInput(input.name),
      email: input.email.trim().toLowerCase(),
      company: input.company ? sanitizeInput(input.company) : null,
      notes: input.notes ? sanitizeInput(input.notes) : null,
    };

    const booking = await reserveSlot({
      packageId: pkg.id,
      startsAt: new Date(input.startsAt),
      ...client,
      clientTimezone: input.timezone ?? null,
      locale,
      holdMinutes: isFree ? null : input.payment === "PAYPAL" ? settings.paypalHoldMinutes : settings.manualHoldHours * 60,
      status: isFree ? "CONFIRMED" : "PENDING_PAYMENT",
      meetingUrl: isFree ? settings.meetingUrl : null,
    });

    if (isFree) {
      try {
        await sendBookingConfirmation(booking);
      } catch (err) {
        console.error("Booking confirmation email failed:", err);
      }
      await emitBookingConfirmed(booking);
      return NextResponse.json({ manageToken: booking.manageToken });
    }

    // From here on the slot is held: if anything fails before the client can
    // pay, release it rather than leave an orphan hold blocking the time.
    try {
      return await startPayment(booking, pkg, client, input, locale, request);
    } catch (err) {
      const held = await prisma.booking
        .update({
          where: { id: booking.id },
          data: { status: "CANCELLED", cancelledAt: new Date(), holdExpiresAt: new Date() },
        })
        .catch(() => null);
      if (held?.orderId) await voidUnpaidOrder(held.orderId, "CANCELLED").catch(() => {});
      throw err;
    }
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Could not complete the booking." }, { status: 500 });
  }
}

async function startPayment(
  booking: { id: string; startsAt: Date; manageToken: string },
  pkg: { title: string; priceCents: number; currency: string },
  client: { name: string; email: string },
  input: { payment: "PAYPAL" | "MANUAL" | "FREE"; provider?: "WAVE" | "DJAMO" | "ORANGE_MONEY" | "PAYPAL"; reference?: string },
  locale: "en" | "fr",
  request: Request
) {
  const settings = await getBookingSettings();
  const when = new Intl.DateTimeFormat("en-GB", {
    timeZone: settings.timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(booking.startsAt);
  const lines = [
    { bookId: null, title: `${pkg.title} — ${when}`, unitPriceCents: pkg.priceCents, quantity: 1 },
  ];
  const order = await createOrderRecord({
    kind: "BOOKING",
    email: client.email,
    name: client.name,
    currency: pkg.currency,
    lines,
    subtotalCents: pkg.priceCents,
    totalCents: pkg.priceCents,
    ...(input.payment === "MANUAL"
      ? {
          paymentMethod: input.provider,
          paymentReference: input.reference ? sanitizeInput(input.reference) : null,
        }
      : {}),
    ipAddress: clientIp(request),
  });
  await prisma.booking.update({ where: { id: booking.id }, data: { orderId: order.id } });

  if (input.payment === "PAYPAL") {
    const started = await startPayPalPayment(order);
    return NextResponse.json({ ...started, manageToken: booking.manageToken });
  }

  notifyManualOrder(order, lines, input.provider!, locale, {
    label: "Consulting &middot; Invoice",
    afterPayment: "Once the payment is confirmed, you'll receive your booking confirmation with a calendar invite. Your time slot is held for you in the meantime.",
    footer: "Your session is confirmed once the payment is received.",
  });
  return NextResponse.json({ receiptToken: order.receiptToken, manageToken: booking.manageToken });
}
