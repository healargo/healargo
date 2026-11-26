/**
 * Preloads derived DATABASE_URL / DIRECT_URL for Prisma CLI commands.
 * Usage: node --env-file=.env.local --env-file=.env scripts/with-db-env.mjs db push
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

function getSupabaseProjectRef(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!supabaseUrl) return null;
  const trimmed = supabaseUrl.trim().replace(/\/$/, "");
  const prefix = "https://";
  const suffix = ".supabase.co";
  if (!trimmed.startsWith(prefix) || !trimmed.endsWith(suffix)) return null;
  const host = trimmed.slice(prefix.length, -suffix.length);
  const ref = host.split(".")[0]?.trim();
  return ref || null;
}

function ensureDatabaseEnv() {
  if (process.env.DATABASE_URL) {
    if (!process.env.DIRECT_URL) process.env.DIRECT_URL = process.env.DATABASE_URL;
    return;
  }
  const projectRef = getSupabaseProjectRef();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!projectRef || !password) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD (or legacy DATABASE_URL) for Prisma.",
    );
  }
  const encoded = encodeURIComponent(password);
  const url = `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
}

try {
  ensureDatabaseEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-db-env.mjs <prisma-args...>");
  process.exit(1);
}

const prismaCli = resolve(process.cwd(), "node_modules/prisma/build/index.js");
const child = spawn(process.execPath, [prismaCli, ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
