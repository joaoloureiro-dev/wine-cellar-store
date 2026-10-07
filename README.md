# Cellarium — Wine Cellar Store

Premium e-commerce platform for wine cellars, built with Next.js 16, React 19,
TypeScript, Tailwind CSS v4, PostgreSQL and Prisma ORM.

## Requirements

- Node.js 20+
- PostgreSQL 16 (local via Docker Compose, or any reachable instance)
- Redis 7, optional (shared cache and rate limits across instances)

## Local development

```bash
# 1. Install dependencies (also generates the Prisma Client)
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start PostgreSQL (and Redis)
docker compose up -d

# 4. Apply migrations and load the sample catalogue
npm run db:deploy
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> `npm run build` also needs a reachable database: catalogue pages are
> statically generated from PostgreSQL at build time.

## Payments

| Method                 | Provider                                   | Confirmation                          |
| ---------------------- | ------------------------------------------ | ------------------------------------- |
| MB WAY                 | ifthenpay or eupago (`PAYMENT_PROVIDER`)   | Provider callback / webhook           |
| Multibanco             | ifthenpay or eupago (`PAYMENT_PROVIDER`)   | Provider callback / webhook           |
| Klarna                 | Stripe Checkout                            | Signed Stripe webhook                 |
| Transferência bancária | — (IBAN from `BANK_TRANSFER_*`)            | Manual reconciliation (backoffice)    |

A method is only offered when its provider is configured (see `.env.example`).
Payments are never marked as paid from the browser: only verified webhooks
(or server-side status checks) can confirm them.

Webhook endpoints to configure in each provider:

- **ifthenpay** (callback, GET):
  `{APP_URL}/api/webhooks/ifthenpay?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]`
- **eupago** (Webhook 2.0, POST): `{APP_URL}/api/webhooks/eupago`
- **Stripe**: `{APP_URL}/api/webhooks/stripe` with the events
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed` and `checkout.session.expired`

Schedule `GET /api/cron/expire-orders` (e.g. every 15 minutes) with
`Authorization: Bearer <CRON_SECRET>` to expire unpaid orders and overdue
reservations and release their stock.

## Caching

The app uses Next.js [Cache Components](https://nextjs.org/docs/app/getting-started/caching)
(`cacheComponents: true`):

- Catalogue reads (`lib/products.ts`, `lib/brands.ts`) run in `'use cache'`
  scopes tagged `catalog` / `brands` (`lib/catalog/cache.ts`). Product,
  brand and home pages are prerendered from them.
- Every change to stock, price or visibility (orders, cancellations, expiry,
  backoffice edits) expires the `catalog` tag, so the next request renders
  fresh data. There is no time-based staleness to wait for.
- `/caves` serves a static shell and streams filters and results.
  Session-bound pages render per request; `proxy.ts` handles their
  redirects and 404s before streaming so HTTP status codes stay correct.

### Redis (optional, recommended for more than one instance)

Set `REDIS_URL` to share the `'use cache'` store and tag invalidations
between instances (`cache-handlers/redis.mjs`). An edit on one instance
reaches the others within about a second. If Redis becomes unavailable the
app keeps serving with a per-instance in-memory cache and resynchronises
when Redis is back.

Locally, `docker compose up -d` also starts Redis; then set
`REDIS_URL="redis://localhost:6379"` in `.env`.

## Backoffice

The backoffice lives at `/admin`. Access is granted from the command line to
an account that already exists (sign up at `/registar` first):

```bash
npm run admin:grant -- ana@example.pt
```

The role is checked against the database on every request and every server
action, and each change made in the backoffice is recorded in
`AdminAuditLog`.

## Scripts

| Script               | Description                                         |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Start the development server                        |
| `npm run build`      | Production build                                    |
| `npm run lint`       | ESLint                                              |
| `npm run typecheck`  | Generate route types and run TypeScript             |
| `npm run db:migrate` | Create and apply a migration in development         |
| `npm run db:deploy`  | Apply pending migrations (CI / production)          |
| `npm run db:seed`    | Load the sample catalogue (idempotent)              |
| `npm run db:studio`  | Open Prisma Studio                                  |
| `npm run admin:grant -- <email> [--revoke]` | Grant or revoke backoffice access |

Run `npm run db:generate` after changing `prisma/schema.prisma`
(`prisma migrate dev` does not regenerate the client in Prisma 7).

## Project structure

| Path          | Responsibility                                            |
| ------------- | --------------------------------------------------------- |
| `app/`        | Routes, pages and layouts                                 |
| `components/` | UI components                                             |
| `lib/`        | Application logic, data access, validation and helpers    |
| `types/`      | Domain types used by the UI                               |
| `prisma/`     | Schema, migrations and seed data                          |

## Conventions

- One coherent feature or update per commit, in English, following
  [Conventional Commits](https://www.conventionalcommits.org/).
- Before committing: `npm run lint`, `npm run typecheck` and `npm run build`.
