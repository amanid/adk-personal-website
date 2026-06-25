import type YahooFinanceClass from "yahoo-finance2";

type YahooClient = InstanceType<typeof YahooFinanceClass>;

// Reuse a single yahoo-finance2 instance across requests so the auth crumb +
// cookie are fetched once per process and reused. Creating a new instance per
// request (the previous behaviour) re-fetched the crumb every time, which is
// what triggers Yahoo's "Failed to get crumb, status 429" rate-limiting on
// datacenter IPs.
let clientPromise: Promise<YahooClient> | null = null;

export function getYahooFinance(): Promise<YahooClient> {
  if (!clientPromise) {
    clientPromise = import("yahoo-finance2")
      .then((m) => new m.default({ suppressNotices: ["yahooSurvey"] }))
      .catch((err) => {
        // Reset so a later request can retry the import/crumb handshake.
        clientPromise = null;
        throw err;
      });
  }
  return clientPromise;
}
