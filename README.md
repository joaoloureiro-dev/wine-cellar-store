# Cellarium — Wine Cellar Store

Premium e-commerce platform for wine cellars, built with Next.js 16, React 19,
TypeScript, Tailwind CSS v4, PostgreSQL and Prisma ORM.

## Requirements

- Node.js 22.12+
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

**Failover.** With `PAYMENT_FALLBACK_PROVIDER` set (and both providers
configured, including webhooks), MB WAY and Multibanco requests move to the
second provider when the first is unavailable. It only happens when it is
safe: always if the request never reached the provider (circuit open,
connection refused); for Multibanco also after timeouts or HTTP errors; never
for MB WAY after an ambiguous failure, which could send the customer a second
payment request. Each attempt is kept as its own payment record.
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
reservations and release their stock. `.github/workflows/scheduled-jobs.yml`
does this through the public domain once the `APP_URL` and `CRON_SECRET`
repository secrets are set.

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

Set `REDIS_URL` to share, between instances:

- the `'use cache'` store and tag invalidations (`cache-handlers/redis.mjs`):
  an edit on one instance reaches the others within about a second;
- sign-in, sign-up and password-change rate limits
  (`lib/auth/rate-limit-storage.ts`), counted atomically. Without Redis
  they are stored in PostgreSQL.

If Redis becomes unavailable the app keeps serving: caching falls back to
per-instance memory, rate limits are enforced per instance, and pending
invalidations are resynchronised when Redis is back. Sessions always stay
in PostgreSQL.

Locally, `docker compose up -d` also starts Redis; then set
`REDIS_URL="redis://localhost:6379"` in `.env`.

## Deployment

Production runs on **Neon** (PostgreSQL), with **Vercel** as the primary
frontend and **Railway** as the fallback behind a failover layer. See
[docs/deployment.md](docs/deployment.md) for the architecture, setup,
environment variables and the failover drill.

## Operations

| Endpoint                | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `GET /api/health`       | Liveness: the process is serving (no dependencies checked)              |
| `GET /api/health/ready` | Readiness: PostgreSQL required (503 if down); Redis optional ("degraded") |
| `GET /api/cron/expire-orders` | Scheduled job (see Payments)                                      |

Server errors are logged as structured JSON (`instrumentation.ts`), with
the route, request method and path, ready for any log collector.

## Client IP behind a proxy

Sign-in, sign-up and password-change rate limits are counted per client
IP. In production, tell the app which header carries the real IP, using a
header that only your proxy sets (a client can send any header to a server
that is reached directly):

| Hosting                     | Setting                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| nginx / Caddy reverse proxy | `TRUSTED_IP_HEADER=x-real-ip` (nginx: `proxy_set_header X-Real-IP $remote_addr;`) |
| Cloudflare                  | `TRUSTED_IP_HEADER=cf-connecting-ip`                                  |
| Load balancer appending `X-Forwarded-For` | `TRUSTED_PROXIES=<proxy IPs or CIDRs>` (the chain is read right to left) |

Without either, a warning is logged at startup: requests with a forwarded
chain would share one rate-limit bucket, so one client could lock everyone
out of signing in.

## Legal pages

`/termos`, `/devolucoes` (14-day withdrawal and model form), `/privacidade`
and `/cookies`, linked on every page together with the Livro de
Reclamações Eletrónico. Checkout and reservation consents link to them.

- Seller details come from the `LEGAL_*` variables (`.env.example`); missing
  values and business decisions still to be made (delivery time, return
  pickup cost, reservation retention) appear as visible highlighted
  markers. The pages are static, so set the variables at build time.
- The texts are a draft based on Portuguese consumer and data-protection
  law (DL 24/2014, DL 84/2021, DL 7/2004, Lei 144/2015, RGPD). **Have them
  reviewed by a lawyer before launch.**
- Update `LEGAL_LAST_UPDATED` (`lib/legal/company.ts`) when the text changes.

## Customer data (RGPD)

From `/conta/perfil` a signed-in customer can:

- **Download their data** (`/api/account/export`): profile, sign-in methods,
  addresses, favourites, orders and reservations linked to the account, as
  JSON. Guest orders placed with the same email are not included, because
  the email address is not verified.
- **Delete their account** (Better Auth `/delete-user`, rate limited). The
  password is always required for accounts that have one; Google-only
  accounts need a session younger than a day. Deletion is refused while an
  order is in progress, a reservation is active, or the account has
  backoffice access. Addresses, favourites and sessions are deleted; orders
  are kept, unlinked, for the legal invoice retention period; finished
  reservations lose their contact details.

## Backoffice

The backoffice lives at `/admin`. Access is granted from the command line to
an account that already exists (sign up at `/registar` first):

```bash
npm run admin:grant -- ana@example.pt
```

The role is checked against the database on every request and every server
action, and each change made in the backoffice is recorded in
`AdminAuditLog`.

Catalogue management:

- **Brands** (`/admin/marcas`) and **products** (`/admin/produtos/novo`):
  specifications, temperature zones, dimensions, energy and SEO. The URL
  (slug) is fixed after creation. New products start hidden.
- **Photos**: JPEG, PNG, WebP or AVIF up to 4 MB, checked by file content.
  The first photo is the main one. A product needs at least one photo to be
  visible, and a visible product keeps at least one.
- Edits use optimistic locking: a change made elsewhere since the form was
  opened (another admin, a sale) is never overwritten silently.

Photos are stored according to `MEDIA_STORAGE`: in `MEDIA_LOCAL_DIR` for
development, or in an S3-compatible bucket in production (see
[docs/deployment.md](docs/deployment.md), "Photo storage").

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
| `npm test`           | Unit tests (see Testing)                            |

Run `npm run db:generate` after changing `prisma/schema.prisma`
(`prisma migrate dev` does not regenerate the client in Prisma 7).

## Testing

| Command                    | What it runs                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| `npm test`                 | Unit tests (Vitest): validation, lifecycles, payments, SEO, …      |
| `npm run test:integration` | Integration tests against PostgreSQL: concurrency, payments, stock |
| `npm run test:e2e`         | Playwright end-to-end tests against a production build             |

Integration tests truncate tables, so they only run against a database
whose name ends in `_test`:

```bash
createdb cellarium_test   # or via psql / docker
export DATABASE_URL="postgresql://cellarium:cellarium@localhost:5432/cellarium_test"
npm run db:test:prepare && npm run test:integration
```

End-to-end tests need a seeded database and a build:

```bash
npm run db:seed && npm run build && npm run test:e2e
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests,
integration tests and the build plus end-to-end tests (with PostgreSQL and
Redis) on every pull request.

## Project structure

| Path          | Responsibility                                            |
| ------------- | --------------------------------------------------------- |
| `app/`        | Routes, pages and layouts                                 |
| `components/` | UI components                                             |
| `lib/`        | Application logic, data access, validation and helpers    |
| `types/`      | Domain types used by the UI                               |
| `prisma/`     | Schema, migrations and seed data                          |
| `tests/`      | Unit, integration and end-to-end tests                    |

## Conventions

- One coherent feature or update per commit, in English, following
  [Conventional Commits](https://www.conventionalcommits.org/).
- Before committing: `npm run lint`, `npm run typecheck` and `npm run build`.
