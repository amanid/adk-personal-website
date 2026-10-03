import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { normalizeLocale } from "@/lib/seo";
import { getBookingSettings } from "@/lib/booking";
import { Link } from "@/i18n/routing";
import { CalendarPlus, CheckCircle2, Clock, AlertCircle, Video, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

// A private bearer-token page: keep it out of search indexes.
export const metadata: Metadata = { title: "Booking", robots: { index: false, follow: false } };

const STATUS_STYLE: Record<string, { icon: typeof CheckCircle2; tone: string }> = {
  PENDING_PAYMENT: { icon: Clock, tone: "text-amber-400" },
  CONFIRMED: { icon: CheckCircle2, tone: "text-green-400" },
  RESCHEDULE_NEEDED: { icon: AlertCircle, tone: "text-amber-400" },
  COMPLETED: { icon: CheckCircle2, tone: "text-text-secondary" },
  CANCELLED: { icon: AlertCircle, tone: "text-text-muted" },
  EXPIRED: { icon: AlertCircle, tone: "text-text-muted" },
};

export default async function ManageBookingPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const l = normalizeLocale(locale);
  if (!token || token.length > 100) notFound();

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { package: true, order: { select: { receiptToken: true, status: true } } },
  });
  if (!booking) notFound();

  const t = await getTranslations({ locale: l, namespace: "booking" });
  const settings = await getBookingSettings();

  // An unpaid hold whose time ran out is expired, whatever the row says yet.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const status =
    booking.status === "PENDING_PAYMENT" && booking.holdExpiresAt && booking.holdExpiresAt.getTime() < now
      ? "EXPIRED"
      : booking.status;

  const zone = booking.clientTimezone || settings.timeZone;
  const when = new Intl.DateTimeFormat(l, {
    timeZone: zone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(booking.startsAt);
  const { icon: Icon, tone } = STATUS_STYLE[status] ?? STATUS_STYLE.CONFIRMED;
  const title = l === "fr" && booking.package.titleFr ? booking.package.titleFr : booking.package.title;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      <p className="eyebrow mb-3">{t("manage_title")}</p>
      <div className="glass p-6 md:p-8">
        <div className="flex items-start gap-3 mb-6">
          <Icon className={`w-7 h-7 shrink-0 ${tone}`} />
          <div>
            <h1 className="text-2xl font-semibold">{t(`status_${status}`)}</h1>
            <p className="text-text-secondary mt-1">{t(`status_${status}_desc`)}</p>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm border-t border-glass-border pt-5">
          <dt className="text-text-muted">{t("session")}</dt>
          <dd>{title}</dd>
          {status !== "RESCHEDULE_NEEDED" && (
            <>
              <dt className="text-text-muted">{t("when")}</dt>
              <dd>{when}</dd>
            </>
          )}
          <dt className="text-text-muted">{t("duration")}</dt>
          <dd>{t("minutes", { n: booking.package.durationMinutes })}</dd>
        </dl>

        <div className="flex flex-wrap gap-3 mt-6">
          {status === "CONFIRMED" &&
            (booking.meetingUrl ? (
              <a
                href={booking.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gold text-charcoal font-semibold hover:bg-gold-light"
              >
                <Video className="w-4 h-4" />
                {t("join")}
              </a>
            ) : (
              <p className="text-sm text-text-secondary w-full">{t("link_to_follow")}</p>
            ))}
          {status === "CONFIRMED" && (
            <a
              href={`/api/bookings/manage/${booking.manageToken}/ics`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-glass-border hover:border-text-muted"
            >
              <CalendarPlus className="w-4 h-4" />
              {t("add_calendar")}
            </a>
          )}
          {status === "PENDING_PAYMENT" && booking.order && (
            <Link
              href={`/store/receipt/${booking.order.receiptToken}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gold text-charcoal font-semibold hover:bg-gold-light"
            >
              <Receipt className="w-4 h-4" />
              {t("view_payment")}
            </Link>
          )}
          {(status === "EXPIRED" || status === "CANCELLED" || status === "COMPLETED") && (
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gold text-charcoal font-semibold hover:bg-gold-light"
            >
              {t("book_again")}
            </Link>
          )}
        </div>

        <p className="text-xs text-text-muted mt-8">
          {t("consultant_tz", { tz: settings.timeZone })} · {t("reschedule_help")}
        </p>
      </div>
    </div>
  );
}
