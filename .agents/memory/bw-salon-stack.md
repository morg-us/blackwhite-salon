---
name: BW Salon Stack Quirks
description: Non-obvious decisions for the Black White Güzellik Salonu project
---

## esbuild cannot bundle @workspace libs
API server uses esbuild — importing `@workspace/integrations-openai-ai-server` fails at build time.
**Fix:** Install the SDK directly (`openai`) in `@workspace/api-server` and instantiate with env vars.

## Stripe connector API returns `secret` not `secret_key`
`stripe-replit-sync` docs show `settings.secret_key` but the Replit connector API actually returns `settings.secret`.
**Fix:** `const secretKey = settings?.secret_key ?? settings?.secret;`

## stripe-replit-sync runMigrations: no schema param
Passing `{ databaseUrl, schema: 'stripe' }` causes "relation stripe.accounts does not exist".
**Fix:** Call `await runMigrations({ databaseUrl })` with no schema param — it creates the stripe schema internally.

## Clerk proxyUrl: dev vs prod
In development (Vite `import.meta.env.DEV`), the Clerk proxy 404s because dev Clerk instances don't support proxying.
**Fix:** Only set `proxyUrl` in production: `proxyUrl={isDev ? undefined : clerkProxyUrl}`

## CartDrawer uses price_data not Stripe price IDs
The store cart holds TL prices from localStorage, not Stripe price_ids. Checkout uses `price_data` dynamically instead of real price IDs.
**Why:** Store products are in siteContent (localStorage), not fetched from Stripe in the frontend.

## Stripe products seeded
Run `pnpm --filter @workspace/scripts exec tsx src/seed-stripe-products.ts` to seed 6 salon products.
Products are synced to stripe schema via webhooks/syncBackfill automatically on server start.
