# FitMeals monorepo

Production-oriented MVP for a **nutrition-first** fitness meal subscription and on-demand delivery platform: three independently deployable Next.js frontends, one shared API, PostgreSQL (Prisma), Razorpay, S3 uploads, and a **WhatsApp provider abstraction** (mock by default).

## Structure

| Path | Purpose |
|------|---------|
| [apps/customer-web](apps/customer-web) | Customer Next.js App Router (port **3000**) |
| [apps/admin-dashboard](apps/admin-dashboard) | Admin Next.js App Router (port **3001**) |
| [apps/rider-web](apps/rider-web) | Rider Next.js App Router (port **3002**) |
| [apps/api](apps/api) | Shared REST API — Next.js route handlers (port **4000**) |
| [packages/ui](packages/ui) | Shared shadcn-style primitives + design tokens |
| [packages/types](packages/types) | Shared Zod + TS types |
| [packages/config](packages/config) | Shared TS/Tailwind preset |
| [packages/utils](packages/utils) | Maps deep links, INR formatting |
| [packages/api-client](packages/api-client) | Typed fetch helpers + TanStack Query keys |
| [prisma](prisma) | Schema, migrations, seed |

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io/) 9+ (`corepack enable` or use `npx pnpm`)
- PostgreSQL 14+ (local or hosted)

## Local PostgreSQL

1. Create a database (example: `fitmeals_dev`).
2. Create a dedicated DB user with a strong password (**local dev only**).
3. Copy [`.env.example`](.env.example) to `.env` at the repo root and set:

   `DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/fitmeals_dev?schema=public"`

   **Never commit real credentials.** Production values belong only in the host’s secret store / env injection.

4. Apply schema and seed:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Seed logins (password **`Password123!`**):

- Admin: `admin@fitmeals.dev`
- Rider: `rider@fitmeals.dev`
- Customer: `alex@fitmeals.dev`, `priya@fitmeals.dev`

## Environment variables

Root [`.env.example`](.env.example) lists:

- `DATABASE_URL`, `JWT_*`, optional `AUTH_COOKIE_DOMAIN`
- `NEXT_PUBLIC_*` URLs for the three apps + API (used by browsers and CORS)
- `AUTH_RETURN_REFRESH_BODY=true` for **local multi-port** dev (refresh token in JSON; **disable in production** or use shared parent-domain cookies)
- AWS S3, Razorpay, WhatsApp placeholders (optional for local)

Copy to `.env` and fill values. The API loads the same file when run from the repo root (or export vars in your process manager).

## Development

From the repo root:

```bash
pnpm dev
```

This runs Turbo `dev` across packages that define it (all four apps). URLs:

- Customer: http://localhost:3000  
- Admin: http://localhost:3001  
- Rider: http://localhost:3002  
- API: http://localhost:4000  

API health: `GET http://localhost:4000/api/v1/health`

### Auth model (summary)

- **Access JWT** (short) — sent as `Authorization: Bearer` from SPAs; stored in `sessionStorage` per app in dev.
- **Refresh token** — httpOnly cookie when same-site; when `AUTH_RETURN_REFRESH_BODY=true`, also returned in JSON and accepted by `POST /api/v1/auth/refresh` body `{ "refreshToken" }` for localhost port separation.
- **RBAC** enforced on the API (`CUSTOMER` / `ADMIN` / `RIDER`); login requires matching `app` (`customer` | `admin` | `rider`).

## Build

```bash
pnpm build
```

Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (min 32 chars), and `DATABASE_URL` for API/prisma tooling.

## End-to-end tests (Playwright)

Requires a migrated + seeded database and `DATABASE_URL` available to the API process.

```bash
pnpm test:e2e
```

Config: [playwright.config.ts](playwright.config.ts) starts API + three Next dev servers (or reuses existing when not in CI). HTML report under `playwright-report/`.

## Deployment notes

- Deploy **each app** and the **API** separately; point all `NEXT_PUBLIC_*` URLs at the real endpoints.
- Use a **shared parent domain** (e.g. `app.`, `admin.`, `rider.`, `api.`) and `AUTH_COOKIE_DOMAIN=.yourdomain.com` with `Secure` cookies in production; **turn off** `AUTH_RETURN_REFRESH_BODY`.
- Run `pnpm db:migrate deploy` (or your host’s migration step) against production `DATABASE_URL`.
- Configure S3, Razorpay, and a real WhatsApp HTTP provider when ready; mock provider logs to `NotificationLog`.

## Scripts (root)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Turbo dev for apps |
| `pnpm build` | Turbo build |
| `pnpm db:generate` | `prisma generate` |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:seed` | Run [prisma/seed.ts](prisma/seed.ts) |
| `pnpm test:e2e` | Playwright |

## License

Private / proprietary — adjust per your organization.
"# App" 
