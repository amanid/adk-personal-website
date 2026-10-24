"use client";

import { useState, useEffect } from "react";
import { Trash2, Loader2, Users, CheckCircle, Clock, Mail, Eye, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  confirmed: boolean;
  createdAt: string;
}

interface DigestStatus {
  enabled: boolean;
  lastSent: string | null;
  lastRun: { at?: string; sent?: number; failed?: number; skipped?: string } | null;
  period: string;
  subscribers: number;
}

interface DigestContent {
  periodLabel: string;
  publications: unknown[];
  posts: unknown[];
  products: unknown[];
  offer: { label: string; price: string } | null;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [digest, setDigest] = useState<{ status: DigestStatus; content: DigestContent } | null>(null);
  const [digestBusy, setDigestBusy] = useState(false);
  const [digestMessage, setDigestMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscribers();
    fetchDigest();
  }, []);

  const fetchDigest = async () => {
    try {
      const res = await fetch("/api/admin/digest");
      if (res.ok) setDigest(await res.json());
    } catch {
      /* the panel simply stays hidden */
    }
  };

  const toggleDigest = async (enabled: boolean) => {
    setDigestBusy(true);
    try {
      const res = await fetch("/api/admin/digest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) await fetchDigest();
    } finally {
      setDigestBusy(false);
    }
  };

  const sendDigestNow = async (force = false) => {
    if (!digest) return;
    if (!confirm(`Send this month's brief to ${digest.status.subscribers} confirmed subscriber(s) now?`)) return;
    setDigestBusy(true);
    setDigestMessage(null);
    try {
      const res = await fetch("/api/admin/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (res.status === 409) {
        if (confirm("The brief was already sent this month. Send it again anyway?")) {
          setDigestBusy(false);
          return sendDigestNow(true);
        }
        setDigestMessage("Not sent: already sent this month.");
      } else if (res.ok) {
        setDigestMessage(data.skipped ? `Not sent: ${data.skipped}.` : `Sent to ${data.sent} subscriber(s)${data.failed ? `, ${data.failed} failed` : ""}.`);
      } else {
        setDigestMessage(data.error || "Sending failed.");
      }
      await fetchDigest();
    } finally {
      setDigestBusy(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/admin/subscribers");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/subscribers?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  };

  const confirmedCount = subscribers.filter((s) => s.confirmed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text">
            Newsletter Subscribers
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage your email newsletter subscribers
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{subscribers.length}</p>
            <p className="text-xs text-text-muted">Total Subscribers</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{confirmedCount}</p>
            <p className="text-xs text-text-muted">Confirmed</p>
          </div>
        </div>
      </div>

      {/* Monthly brief */}
      {digest && (
        <section className="glass rounded-xl p-5 mb-8" aria-labelledby="digest-title">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 id="digest-title" className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <Mail className="w-5 h-5 text-gold" />
                Monthly brief
              </h2>
              <p className="text-sm text-text-secondary mt-1 max-w-2xl">
                One email a month to confirmed subscribers with the month&apos;s research, posts and store titles, and a single
                paid link: {digest.content.offer ? `the ${digest.content.offer.label} (${digest.content.offer.price})` : "the consulting page"}.
                It goes out automatically on the first cron run of each month when enabled, and never when nothing was published.
              </p>
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted">
                <div><dt className="inline">This month: </dt><dd className="inline text-text-secondary">{digest.content.publications.length} publications · {digest.content.posts.length} posts · {digest.content.products.length} store titles</dd></div>
                <div><dt className="inline">Last sent: </dt><dd className="inline text-text-secondary">{digest.status.lastSent || "never"}</dd></div>
                {digest.status.lastRun?.at && (
                  <div><dt className="inline">Last run: </dt><dd className="inline text-text-secondary">{formatDate(digest.status.lastRun.at)} · {digest.status.lastRun.skipped ? digest.status.lastRun.skipped : `${digest.status.lastRun.sent} sent, ${digest.status.lastRun.failed} failed`}</dd></div>
                )}
              </dl>
              {digestMessage && <p role="status" className="mt-2 text-sm text-gold">{digestMessage}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <label className="inline-flex items-center gap-2 text-sm text-text-secondary mr-2">
                <input
                  type="checkbox"
                  checked={digest.status.enabled}
                  disabled={digestBusy}
                  onChange={(e) => toggleDigest(e.target.checked)}
                  className="accent-[var(--color-gold)] w-4 h-4"
                />
                Send automatically
              </label>
              <a
                href="/api/admin/digest?preview=1"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg border border-glass-border text-sm text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]"
              >
                <Eye className="w-4 h-4" />
                Preview
              </a>
              <button
                type="button"
                onClick={() => sendDigestNow(false)}
                disabled={digestBusy || digest.status.subscribers === 0}
                className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg bg-gold text-charcoal text-sm font-medium hover:bg-gold-light disabled:opacity-50"
              >
                {digestBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send now
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Table */}
      {subscribers.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No subscribers yet.</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-glass-border last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {subscriber.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {subscriber.confirmed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                          <CheckCircle className="w-3 h-3" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {formatDate(subscriber.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(subscriber.id)}
                        disabled={deleting === subscriber.id}
                        className="p-1.5 text-text-muted hover:text-danger transition-colors disabled:opacity-50"
                        title="Remove subscriber"
                      >
                        {deleting === subscriber.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
