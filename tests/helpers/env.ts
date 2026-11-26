/**
 * Test environment loader.
 *
 * Order (first value wins): real process env > .env.test.local > .env.test.
 * Only DATABASE_URL / DIRECT_URL may fall back to the app's .env.local / .env,
 * because the owner runs the tests against the same database as the app.
 * Every external service is forced to a local fake or switched off, so real
 * Cashfree / Brevo / PostHog / ST Courier credentials are never used.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";
import { ensureDatabaseEnv } from "../../src/lib/db/supabase-database-url";

const ROOT = path.resolve(__dirname, "../..");

function readEnvFile(name: string): Record<string, string> {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) return {};
  return parse(fs.readFileSync(file));
}

export const FAKE_SERVICES_PORT = Number(process.env.FAKE_SERVICES_PORT || 4599);
export const FAKE_SERVICES_URL = `http://127.0.0.1:${FAKE_SERVICES_PORT}`;

/** Values that always win: dummy secrets and fakes, never real services. */
export function forcedTestEnv(fakeUrl = FAKE_SERVICES_URL): Record<string, string> {
  return {
    CASHFREE_ENV: "SANDBOX",
    CASHFREE_APP_ID: "test_app_id",
    CASHFREE_SECRET_KEY: "test_secret_key",
    CASHFREE_API_VERSION: "2023-08-01",
    CASHFREE_BASE_URL: fakeUrl,
    ST_COURIER_BASE_URL: fakeUrl,
    BREVO_API_KEY: "test-brevo-key",
    BREVO_API_URL: `${fakeUrl}/v3/smtp/email`,
    EMAIL_FROM: "Healargo Test <noreply@healargo.test>",
    ADMIN_NOTIFY_EMAIL: "admin-notify@healargo.test",
    CRON_SECRET: "test-cron-secret",
    AUTH_SECRET: "test-auth-secret-at-least-32-characters-long",
    AUTH_GOOGLE_ID: "",
    AUTH_GOOGLE_SECRET: "",
    NEXT_PUBLIC_POSTHOG_KEY: "",
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "",
    NEXT_PUBLIC_GA_ID: "",
  };
}

/**
 * A test setting from the real environment, else .env.test.local / .env.test.
 * Used for timeouts and pool sizes, which are read before loadTestEnv runs.
 */
export function testSetting(name: string): string | undefined {
  if (process.env[name] !== undefined && process.env[name] !== "") return process.env[name];
  const fileEnv = { ...readEnvFile(".env.test"), ...readEnvFile(".env.test.local") };
  return fileEnv[name] || undefined;
}

export function testSettingNumber(name: string, fallback: number): number {
  const value = Number(testSetting(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Per-test / per-hook timeouts. Generous by default: a remote DB costs ~0.2-0.5 s per query. */
export const TEST_TIMEOUT_MS = testSettingNumber("TEST_TIMEOUT_MS", 120_000);
export const TEST_HOOK_TIMEOUT_MS = testSettingNumber("TEST_HOOK_TIMEOUT_MS", 300_000);

/**
 * Keeps the tests gentle on a remote database: a small Prisma pool (so a burst
 * of parallel queries queues instead of opening many connections at once) and
 * long connect / pool waits. Only adds parameters the URL does not set itself.
 */
export function tuneDatabaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  const defaults: Record<string, string> = {
    connection_limit: String(testSettingNumber("TEST_DB_CONNECTION_LIMIT", 3)),
    pool_timeout: String(testSettingNumber("TEST_DB_POOL_TIMEOUT_S", 120)),
    connect_timeout: String(testSettingNumber("TEST_DB_CONNECT_TIMEOUT_S", 60)),
  };
  let changed = false;
  for (const [key, value] of Object.entries(defaults)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
      changed = true;
    }
  }
  return changed ? url.toString() : raw;
}

export function loadTestEnv(fakeUrl = FAKE_SERVICES_URL) {
  const fileEnv = { ...readEnvFile(".env.test"), ...readEnvFile(".env.test.local") };
  for (const [key, value] of Object.entries(fileEnv)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  if (!process.env.DATABASE_URL) {
    const appEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
    if (appEnv.DATABASE_URL) process.env.DATABASE_URL = appEnv.DATABASE_URL;
    if (!process.env.DIRECT_URL && appEnv.DIRECT_URL) process.env.DIRECT_URL = appEnv.DIRECT_URL;
    // Mentorbridge-style: derive from Supabase URL + DB password when legacy URLs absent
    if (!process.env.DATABASE_URL) {
      if (appEnv.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        process.env.NEXT_PUBLIC_SUPABASE_URL = appEnv.NEXT_PUBLIC_SUPABASE_URL;
      }
      if (appEnv.SUPABASE_DB_PASSWORD && !process.env.SUPABASE_DB_PASSWORD) {
        process.env.SUPABASE_DB_PASSWORD = appEnv.SUPABASE_DB_PASSWORD;
      }
      try {
        ensureDatabaseEnv();
      } catch {
        // leave unset; assertDatabaseWritesAllowed will fail clearly
      }
    }
  }
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = tuneDatabaseUrl(process.env.DATABASE_URL);
  }

  Object.assign(process.env, forcedTestEnv(fakeUrl));
  if (!process.env.NEXT_PUBLIC_SITE_URL) process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3100";
}

/**
 * The API and E2E suites WRITE to the database in DATABASE_URL (the owner's
 * shared Supabase DB). Refuse to start unless that is explicitly confirmed.
 */
export function assertDatabaseWritesAllowed() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Put it in .env.test.local (see tests/README.md).",
    );
  }
  if (process.env.TESTS_MAY_WRITE_TO_DATABASE !== "yes") {
    throw new Error(
      "API/E2E tests create and delete rows in the database at DATABASE_URL. " +
        "Set TESTS_MAY_WRITE_TO_DATABASE=yes in .env.test.local to confirm (see tests/README.md).",
    );
  }
}

export function describeDatabase(): string {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    return `${url.hostname}:${url.port || "5432"}${url.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}
