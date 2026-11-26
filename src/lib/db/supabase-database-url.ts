/**
 * Healargo keeps Prisma (unlike Mentorbridge Hub, which uses the Supabase JS client).
 * Prisma still needs a Postgres URL — we derive it from the Supabase project URL +
 * database password so .env only needs the Mentorbridge-style keys plus the DB password
 * (no DATABASE_URL / DIRECT_URL required).
 */

const SUPABASE_HOST_PREFIX = "https://";
const SUPABASE_HOST_SUFFIX = ".supabase.co";

export function getSupabaseProjectRef(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string | null {
  if (!supabaseUrl) return null;
  const trimmed = supabaseUrl.trim().replace(/\/$/, "");
  if (!trimmed.startsWith(SUPABASE_HOST_PREFIX) || !trimmed.endsWith(SUPABASE_HOST_SUFFIX)) {
    return null;
  }
  const host = trimmed.slice(SUPABASE_HOST_PREFIX.length, -SUPABASE_HOST_SUFFIX.length);
  const ref = host.split(".")[0]?.trim();
  return ref || null;
}

function buildDirectUrl(projectRef: string, password: string): string {
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
}

function buildPooledUrl(projectRef: string, password: string): string {
  // Session/transaction pooler user form: postgres.<ref>
  // Prefer direct host for local/dev simplicity; pooler region varies by project.
  // Use direct URL for both when pooler host is unknown — matches prior Healargo .env.
  return buildDirectUrl(projectRef, password);
}

/**
 * Ensures process.env.DATABASE_URL (and DIRECT_URL) are set for Prisma.
 * Prefer explicit DATABASE_URL if already provided (tests / legacy).
 */
export function ensureDatabaseEnv(): void {
  if (process.env.DATABASE_URL) {
    if (!process.env.DIRECT_URL) {
      process.env.DIRECT_URL = process.env.DATABASE_URL;
    }
    return;
  }

  const projectRef = getSupabaseProjectRef();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();

  if (!projectRef || !password) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD (or legacy DATABASE_URL) for Prisma.",
    );
  }

  const url = buildPooledUrl(projectRef, password);
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
}
