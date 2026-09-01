/**
 * SMTP configuration for outgoing mail — server-only.
 *
 * Configuration lives in `SiteSetting` so it can be changed from the admin UI
 * without a redeploy, and falls back to the original environment variables so
 * an existing deployment keeps working untouched until something is saved.
 *
 * The password is encrypted at rest (AES-256-GCM, key derived from AUTH_SECRET)
 * and is never returned to the client — the admin API reports only whether one
 * is set.
 */
import crypto from "node:crypto";
import { prisma } from "./prisma";

export const SMTP_SETTING_PREFIX = "smtp.";

const KEYS = {
  host: "smtp.host",
  port: "smtp.port",
  secure: "smtp.secure",
  user: "smtp.user",
  password: "smtp.password",
  from: "smtp.from",
  replyTo: "smtp.replyTo",
} as const;

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  replyTo: string;
  /** Where each value came from, for the admin UI. */
  source: "database" | "environment" | "none";
}

/** Public shape — safe to send to the browser (never includes the password). */
export interface EmailConfigPublic {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  replyTo: string;
  hasPassword: boolean;
  configured: boolean;
  source: EmailConfig["source"];
}

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required to store the SMTP password securely");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/** AES-256-GCM, serialized as `v1:<iv>:<tag>:<ciphertext>` (all base64). */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

/** Reverse of {@link encryptSecret}. Returns "" if the value can't be decrypted. */
export function decryptSecret(stored: string): string {
  try {
    const [version, ivB64, tagB64, ctB64] = stored.split(":");
    if (version !== "v1" || !ivB64 || !tagB64 || !ctB64) return "";
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(ctB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Wrong key (AUTH_SECRET rotated) or corrupt value — treat as unset.
    return "";
  }
}

async function readSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { startsWith: SMTP_SETTING_PREFIX } },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    // DB unavailable — fall back to env entirely.
    return {};
  }
}

/** Resolve the effective SMTP configuration (database first, then environment). */
export async function getEmailConfig(): Promise<EmailConfig> {
  const s = await readSettings();

  const dbHost = s[KEYS.host]?.trim();
  const envHost = process.env.SMTP_HOST?.trim();
  const fromDb = Boolean(dbHost);

  const host = dbHost || envHost || "";
  const user = (fromDb ? s[KEYS.user] : process.env.SMTP_USER) || "";
  const password = fromDb
    ? decryptSecret(s[KEYS.password] || "")
    : process.env.SMTP_PASSWORD || "";
  const portRaw = fromDb ? s[KEYS.port] : process.env.SMTP_PORT;
  const port = Number(portRaw) || 587;
  const secure = fromDb ? s[KEYS.secure] === "true" : port === 465;
  const from =
    (fromDb ? s[KEYS.from] : process.env.EMAIL_FROM) ||
    process.env.EMAIL_FROM ||
    "noreply@konanamanidieudonne.org";
  const replyTo = (fromDb ? s[KEYS.replyTo] : process.env.EMAIL_REPLY_TO) || "";

  return {
    host,
    port,
    secure,
    user,
    password,
    from,
    replyTo,
    source: host ? (fromDb ? "database" : "environment") : "none",
  };
}

/** True when enough is configured to attempt a send. */
export function isConfigComplete(cfg: EmailConfig): boolean {
  return Boolean(cfg.host && cfg.user && cfg.password);
}

/** Strip the password so the config can safely cross to the browser. */
export function toPublicConfig(cfg: EmailConfig): EmailConfigPublic {
  return {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    user: cfg.user,
    from: cfg.from,
    replyTo: cfg.replyTo,
    hasPassword: Boolean(cfg.password),
    configured: isConfigComplete(cfg),
    source: cfg.source,
  };
}

export interface EmailConfigInput {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  /** Omit or leave empty to keep the stored password unchanged. */
  password?: string;
  from: string;
  replyTo?: string;
}

/** Persist the SMTP configuration. An empty password keeps the existing one. */
export async function saveEmailConfig(input: EmailConfigInput): Promise<void> {
  const entries: Array<[string, string]> = [
    [KEYS.host, input.host.trim()],
    [KEYS.port, String(input.port)],
    [KEYS.secure, String(Boolean(input.secure))],
    [KEYS.user, input.user.trim()],
    [KEYS.from, input.from.trim()],
    [KEYS.replyTo, (input.replyTo || "").trim()],
  ];

  if (input.password) {
    entries.push([KEYS.password, encryptSecret(input.password)]);
  }

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );
}
