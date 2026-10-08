# Deployment and failover

Target: **≥ 98% monthly uptime** (at most ~14.6 hours of downtime a month).
The design aims well above that by removing single points of failure where
it is affordable and degrading gracefully where it is not.

## Architecture

```
                       ┌──────────────────────────────────────┐
  customers ─────────► │ Failover layer (Cloudflare LB / DNS) │  health check:
                       │  primary → Vercel, fallback → Railway│  GET /api/health/ready
                       └───────────┬──────────────┬───────────┘
                                   │              │ (only when Vercel is unhealthy)
                         ┌─────────▼───┐    ┌─────▼────────┐
                         │ Vercel      │    │ Railway      │   same commit, same env,
                         │ (primary)   │    │ (fallback)   │   same public domain
                         └─────┬───────┘    └──────┬───────┘
                               │                   │
          ┌────────────────────┼───────────────────┼────────────────────┐
          │                    ▼                   ▼                    │
          │   Neon PostgreSQL (single source of truth, HA storage)     │
          │   Redis (Upstash, optional: shared cache + rate limits)    │
          │   Cloudflare R2 (product photos, public bucket domain)     │
          │   Payments: ifthenpay ⇄ eupago failover, Stripe (Klarna)   │
          └────────────────────────────────────────────────────────────┘

  GitHub Actions (every 15 min) ──► https://<domain>/api/cron/expire-orders
```

Both frontends run the **same build of the same commit** against the same
Neon database and Redis, behind one public domain. Sessions (PostgreSQL),
carts (cookies on the domain) and caches (Redis) are shared, so customers
keep their session and cart when traffic moves to Railway.

## What happens when something fails

| Component fails       | Effect                                                                                 | Built-in handling |
| --------------------- | -------------------------------------------------------------------------------------- | ----------------- |
| Vercel                | Health check fails → traffic moves to Railway                                          | Failover layer + `/api/health/ready` |
| Railway               | No effect while Vercel is healthy                                                      | — |
| Neon (restart, scale from zero, failover) | Requests wait and retry for ~2s                                      | Connection retry for every query, read retry (`lib/db.ts`) |
| Neon (prolonged outage) | Readiness 503 on both frontends; site down                                           | **Single point of failure** — use a paid Neon plan (99.95% SLA), PITR backups |
| Redis                 | Caches per instance, rate limits per instance; site keeps working                      | Circuit breaker + in-memory fallback, resync on recovery |
| ifthenpay or eupago   | MB WAY/Multibanco move to the other provider when safe                                 | `PAYMENT_FALLBACK_PROVIDER` (`lib/payments/failover.ts`) |
| Stripe                | Klarna unavailable; other methods unaffected                                           | Circuit breaker, clear message |
| Cloudflare R2         | New uploads fail with a clear message; existing photos keep loading from the image cache | Upload errors handled; files removed if the record fails |
| GitHub Actions cron   | Unpaid orders expire later than planned (stock held longer)                            | Idempotent job; can be run manually |

The remaining single point of failure is the database, which is expected
for a store with one source of truth for stock and orders. Neon keeps
storage replicated across availability zones and restarts compute
automatically; the app rides out those restarts.

## Setup

### 1. Neon (database)

1. Create the project in **AWS eu-central-1 (Frankfurt)**, next to Vercel's `fra1`.
2. Copy both connection strings:
   - **pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **direct** → `DIRECT_URL` (migrations only)
3. Production: disable scale-to-zero on the production branch (paid plan) to
   avoid cold starts; enable point-in-time restore.

### 2. Redis (recommended)

Create an **Upstash Redis** database in an EU region and use its TLS URL
(`rediss://…`) as `REDIS_URL` on both platforms. Without Redis the site still
works, but each instance has its own cache and rate limits.

### 3. Photo storage (Cloudflare R2)

Both frontends must see the same photos, and Vercel's file system is
read-only, so uploads go to a bucket:

1. Cloudflare → R2 → create bucket `cellarium-media` (location hint: EU).
2. Bucket → Settings → **Custom domain** (e.g. `media.cellarium.pt`), or
   enable the `r2.dev` public URL for testing. This is `MEDIA_PUBLIC_URL`.
3. R2 → Manage API tokens → **Object Read & Write**, limited to this
   bucket. Copy the access key ID, secret and the S3 endpoint
   (`https://<account-id>.r2.cloudflarestorage.com`).
4. Set on both platforms (and their build environments):
   `MEDIA_STORAGE=s3`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
   `S3_SECRET_ACCESS_KEY`, `MEDIA_PUBLIC_URL`. `MEDIA_PUBLIC_URL` is read at
   build time to allow the domain in `next/image`; redeploy after changing it.

Any S3-compatible service works the same way (set `S3_REGION` when it is not
`auto`). Photos uploaded with `MEDIA_STORAGE=local` stay on that machine.

### 4. Vercel (primary)

1. Import the repository; framework preset **Next.js**. `vercel.json` pins the
   region (`fra1`) and runs `npm run build:deploy` (migrations, then build).
2. Set the environment variables (table below), with `DATABASE_POOL_MAX=5`.
3. Add the production domain.

### 5. Railway (fallback)

1. New service → deploy from the GitHub repository. `railway.json` sets the
   build (`npm run build:deploy`), start command and the health check
   (`/api/health/ready`); choose an EU region.
2. Same environment variables as Vercel, with `DATABASE_POOL_MAX=10`.
3. With more than one replica, set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
   (same value on all replicas; generate with `openssl rand -base64 32`).

Migrations may run from both builds at once: Prisma takes an advisory lock
and applies each migration once. Keep migrations backwards compatible
(expand, deploy, then contract), since both platforms briefly run different
versions during a deploy.

### 6. Failover layer

**Recommended: Cloudflare Load Balancing** (paid add-on), with the domain's
DNS on Cloudflare:

1. **Monitor**: HTTPS `GET /api/health/ready`, expect `200`, interval 60s,
   2 retries, timeout 5s.
2. **Pools**: `vercel` (origin `<project>.vercel.app`) and `railway` (origin
   `<service>.up.railway.app`), each with the origin's own hostname as the
   `Host` header.
3. **Load balancer** on the public hostname: pool order `vercel`, then
   `railway` (failover steering, no session affinity needed).
4. Set `TRUSTED_IP_HEADER=cf-connecting-ip` on both platforms.

Alternative without a proxy: DNS failover (Cloudflare LB in DNS-only mode,
AWS Route 53 failover records, …) with a short TTL (≤ 60s). In that case use
the platform's client-IP header instead (`x-real-ip` on Vercel; check
Railway's documentation for its forwarded-IP header).

Vercel supports running behind another proxy, but recommends against it
because its own firewall then sees the proxy's IPs; the DNS-only mode avoids
that trade-off.

### 7. Providers and jobs

- Point the payment webhooks (README → Payments) at the **public domain**, so
  they reach whichever frontend is active. Configure both ifthenpay and
  eupago and set `PAYMENT_FALLBACK_PROVIDER`.
- GitHub repository secrets `APP_URL` and `CRON_SECRET` enable
  `.github/workflows/scheduled-jobs.yml` (expiry job every 15 minutes).

## Environment variables

Identical on Vercel and Railway unless noted.

| Variable | Notes |
| -------- | ----- |
| `APP_URL` | Public domain, e.g. `https://www.cellarium.pt` (not the platform URL) |
| `DATABASE_URL`, `DIRECT_URL` | Neon pooled / direct |
| `DATABASE_POOL_MAX` | Vercel `5`, Railway `10` |
| `REDIS_URL` | Upstash `rediss://…` |
| `BETTER_AUTH_SECRET` | **Same value on both**, or sessions break on failover |
| `CRON_SECRET` | Same value as the GitHub secret |
| `TRUSTED_IP_HEADER` / `TRUSTED_PROXIES` | See README → Client IP behind a proxy |
| Payment and bank-transfer variables | See `.env.example` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Railway with several replicas |
| `LEGAL_*` | Seller details on the legal pages; also needed at build time |
| `MEDIA_STORAGE`, `S3_*`, `MEDIA_PUBLIC_URL` | Photo storage (step 3); `MEDIA_STORAGE=s3` |

## Failover drill (do this before launch)

1. Open the store through the public domain, sign in and add a product to the cart.
2. Make Vercel unhealthy: in Cloudflare, disable the `vercel` origin (or
   promote a deployment that fails readiness on a preview domain first).
3. Within ~2 minutes the monitor marks it down; reload: the page is served
   by Railway (`x-nextjs-deployment-id` starts with `railway-`), the session
   and cart are still there, and checkout works.
4. Re-enable Vercel and confirm traffic returns.

## To verify on the first deployment

These depend on the platforms' current behaviour and could not be tested
from the repository:

- Whether Vercel uses the custom `cacheHandlers` (Redis) or its own cache for
  `'use cache'`. Either way, invalidations from the backoffice reach Railway
  through Redis; confirm a price change appears on both frontends.
- Railway's build settings in `railway.json` (builder name, health check)
  against its current schema.
- Upload a photo through each frontend and confirm it shows on both
  (bucket permissions and `MEDIA_PUBLIC_URL` in `next/image`).
- That `RAILWAY_DEPLOYMENT_ID` is available at build time (used for the
  deployment ID); otherwise set `NEXT_DEPLOYMENT_ID` on Railway.
