/**
 * IndexNow (https://www.indexnow.org): tell Bing, Yandex, Seznam, Naver and
 * other participating search engines the moment a public page is published
 * or changed, instead of waiting for the next crawl. Google doesn't take part;
 * it keeps using the sitemap.
 *
 * The key is public by design: it's served at /indexnow.txt so engines can
 * check that submissions come from the site's owner. Only production sends
 * to the real endpoint; elsewhere nothing is sent unless INDEXNOW_ENDPOINT
 * points at a local test receiver.
 */
import { after } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { BASE_URL } from "./seo";

const SETTING = "indexnow.key";
const KEY_RE = /^[a-zA-Z0-9-]{8,128}$/;

export async function getIndexNowKey(): Promise<string> {
  const env = process.env.INDEXNOW_KEY?.trim();
  if (env && KEY_RE.test(env)) return env;
  const row = await prisma.siteSetting.findUnique({ where: { key: SETTING } });
  if (row && KEY_RE.test(row.value)) return row.value;
  const key = randomBytes(16).toString("hex");
  // Two first requests at once must agree on one key: keep whichever landed.
  await prisma.siteSetting.upsert({ where: { key: SETTING }, update: {}, create: { key: SETTING, value: key } });
  return (await prisma.siteSetting.findUnique({ where: { key: SETTING } }))!.value;
}

function endpoint(): string | null {
  if (process.env.NODE_ENV === "production") return "https://api.indexnow.org/indexnow";
  return process.env.INDEXNOW_ENDPOINT || null;
}

/** Submit site paths (e.g. "/store/my-book"); both language versions are sent. */
export async function submitIndexNow(paths: string[]): Promise<{ status: number } | null> {
  const url = endpoint();
  if (!url || !paths.length) return null;
  const host = new URL(BASE_URL).host;
  const urlList = paths.flatMap((p) => [`${BASE_URL}/en${p}`, `${BASE_URL}/fr${p}`]);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: await getIndexNowKey(), keyLocation: `${BASE_URL}/indexnow.txt`, urlList }),
      signal: AbortSignal.timeout(8000),
    });
    // 200 = accepted, 202 = accepted pending key check; anything else is worth a log line.
    if (res.status !== 200 && res.status !== 202) console.warn(`[indexnow] HTTP ${res.status} for ${urlList.length} URL(s)`);
    return { status: res.status };
  } catch (e) {
    console.warn("[indexnow] failed:", (e as Error).message);
    return null;
  }
}

/** Fire after the response is sent, so an admin save never waits on it. */
export function announceChange(...paths: string[]) {
  after(() => submitIndexNow(paths));
}
