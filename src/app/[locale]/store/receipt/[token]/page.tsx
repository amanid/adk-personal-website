import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { normalizeLocale } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import PrintReceiptButton from "@/components/store/PrintReceiptButton";
import { Download, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

// Receipts are private, unguessable-token pages — keep them out of search indexes.
export const metadata: Metadata = {
  title: "Receipt",
  robots: { index: false, follow: false },
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const l = normalizeLocale(locale);

  const order = await prisma.order.findUnique({
    where: { receiptToken: token },
    include: { items: true, downloads: true },
  });

  if (!order) notFound();

  const isPaid = order.status === "PAID";
  const titles = new Map(order.items.map((i) => [i.bookId, i.titleSnapshot]));
  // Server Component: reading the current time at request render is intentional.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="glass rounded-2xl p-8 print:shadow-none">
        {/* Status header */}
        {isPaid ? (
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold">
                {l === "fr" ? "Paiement confirmé" : "Payment confirmed"}
              </h1>
              <p className="text-text-secondary text-sm">
                {l === "fr" ? "Merci pour votre achat." : "Thank you for your purchase."}
              </p>
            </div>
          </div>
        ) : order.status === "PENDING" ? (
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold">
                {l === "fr" ? "Paiement en attente" : "Payment pending"}
              </h1>
              <p className="text-text-secondary text-sm">
                {l === "fr"
                  ? "Ce paiement n'a pas encore été confirmé."
                  : "This payment has not been confirmed yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold">
                {l === "fr" ? "Commande non payée" : "Order not paid"}
              </h1>
              <p className="text-text-secondary text-sm">Status: {order.status}</p>
            </div>
          </div>
        )}

        {/* Receipt meta */}
        <div className="grid grid-cols-2 gap-4 text-sm border-y border-glass-border py-4 mb-6">
          <div>
            <span className="text-text-secondary block">
              {l === "fr" ? "N° de commande" : "Order number"}
            </span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div>
            <span className="text-text-secondary block">{l === "fr" ? "Date" : "Date"}</span>
            <span className="font-medium">
              {(order.paidAt ?? order.createdAt).toLocaleString(l === "fr" ? "fr-FR" : "en-US")}
            </span>
          </div>
          <div>
            <span className="text-text-secondary block">Email</span>
            <span className="font-medium break-all">{order.email}</span>
          </div>
          {order.paypalCaptureId && (
            <div>
              <span className="text-text-secondary block">PayPal ID</span>
              <span className="font-medium break-all">{order.paypalCaptureId}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="text-text-secondary text-left border-b border-glass-border">
              <th className="pb-2 font-medium">{l === "fr" ? "Article" : "Item"}</th>
              <th className="pb-2 font-medium text-center">{l === "fr" ? "Qté" : "Qty"}</th>
              <th className="pb-2 font-medium text-right">{l === "fr" ? "Montant" : "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-glass-border/50">
                <td className="py-2">{item.titleSnapshot}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">
                  {formatPrice(item.unitPriceCents * item.quantity, order.currency)}
                </td>
              </tr>
            ))}
            <tr>
              <td className="pt-3 font-bold" colSpan={2}>
                {l === "fr" ? "Total payé" : "Total paid"}
              </td>
              <td className="pt-3 font-bold text-right text-gold">
                {formatPrice(order.totalCents, order.currency)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Downloads */}
        {isPaid && (
          <div className="mb-6 print:hidden">
            <h2 className="text-lg font-semibold mb-3">
              {l === "fr" ? "Vos téléchargements" : "Your downloads"}
            </h2>
            <div className="space-y-2">
              {order.downloads.map((grant) => {
                const expired = grant.expiresAt.getTime() < now;
                const exhausted = grant.downloadCount >= grant.maxDownloads;
                const disabled = expired || exhausted;
                return (
                  <div
                    key={grant.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-glass-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {titles.get(grant.bookId) || "Your book"}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {expired
                          ? l === "fr"
                            ? "Lien expiré"
                            : "Link expired"
                          : exhausted
                            ? l === "fr"
                              ? "Limite de téléchargements atteinte"
                              : "Download limit reached"
                            : `${grant.maxDownloads - grant.downloadCount} ${
                                l === "fr" ? "téléchargements restants" : "downloads left"
                              }`}
                      </p>
                    </div>
                    {disabled ? (
                      <span className="text-xs text-text-secondary px-4 py-2">
                        {l === "fr" ? "Indisponible" : "Unavailable"}
                      </span>
                    ) : (
                      <a
                        href={`/api/store/download/${grant.token}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-charcoal font-semibold text-sm hover:bg-gold-light transition-all shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        {l === "fr" ? "Télécharger" : "Download"}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-text-secondary mt-3">
              {l === "fr"
                ? "Ces liens sont privés et expirent après 7 jours. Une copie vous a été envoyée par email."
                : "These links are private and expire after 7 days. A copy has also been emailed to you."}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <PrintReceiptButton label={l === "fr" ? "Imprimer / Enregistrer en PDF" : "Print / Save as PDF"} />
          <Link
            href="/store"
            className="text-sm text-text-secondary hover:text-gold transition-colors"
          >
            {l === "fr" ? "Continuer les achats" : "Continue shopping"}
          </Link>
        </div>
      </div>
    </div>
  );
}
