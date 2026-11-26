# Healargo

Modern ecommerce storefront for Healargo — natural wellness products.

## Stack

- Next.js (App Router) + TypeScript
- Supabase PostgreSQL (Prisma ORM)
- Tailwind CSS 4 + shadcn/ui + Lucide
- NextAuth v5 (email/password + Google)
- Cashfree Payment Gateway
- Zustand cart + TanStack Query

## Getting started

1. Create a [Supabase](https://supabase.com) project
2. Copy **Project URL**, **anon/publishable key**, and **service_role/secret key** (same three keys as Mentorbridge Hub), plus the **database password**
3. Configure env and push the schema:

```bash
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_PASSWORD, AUTH_SECRET, Google OAuth
npm run db:push
npm run seed
npm run dev
```

Admin: `/admin` (seed credentials from `.env.local`)

### Auth

- Email/password and Google sign-in are both enabled
- Google button is hidden when `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are unset
- Forgot/reset password: `/forgot-password` and `/reset-password`
- Public registration always creates a **user** role
- Admins can add users and change roles at `/admin/users`
- Google redirect URI: `{AUTH_URL}/api/auth/callback/google`

## Database (Supabase)

Mentorbridge-style API keys (required). Prisma connection strings are **derived in code** from the project URL + database password — do not set `DATABASE_URL` / `DIRECT_URL`.

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role / secret key (server-only) |
| `SUPABASE_DB_PASSWORD` | Database password (Prisma only; Mentorbridge does not need this because it uses the Supabase client) |

```bash
npm run db:generate   # prisma generate
npm run db:push       # push schema to Supabase (dev)
npm run db:migrate    # prisma migrate dev
npm run db:studio     # browse data
```

## Production (Vercel + Supabase)

| Variable | Notes |
|----------|--------|
| Supabase URL + anon + service role + `SUPABASE_DB_PASSWORD` | Same as local (URLs derived for Prisma) |
| `AUTH_SECRET` | strong random secret |
| `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` | your production HTTPS origin |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | required for Google button on login/register; also add redirect URI `{AUTH_URL}/api/auth/callback/google` in Google Cloud Console |
| `CASHFREE_ENV` | `SANDBOX` or `PRODUCTION` |
| `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` | Cashfree API keys |
| `CASHFREE_API_VERSION` | default `2023-08-01` |
| `EMAIL_FROM` / `BREVO_API_KEY` | Brevo transactional email |
| `ADMIN_NOTIFY_EMAIL` | contact form + paid-order alerts |

## Scripts

- `npm run dev` — local Next.js
- `npm run build` / `npm start` — production build
- `npm run seed` — seed Postgres via Prisma
- `npm test` — unit tests (coupons/pricing)
