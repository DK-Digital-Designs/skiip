# SKIIP

SKIIP is a festival and venue ordering platform.

The current product supports:
- buyer signup/login and authenticated checkout
- vendor storefronts and live order handling
- Stripe Connect onboarding and Stripe Checkout
- webhook-driven payment finalization
- vendor/admin operational dashboards
- a separate static marketing site in `site/`

The source of truth for project documentation is the [`docs`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs) directory.

Start here:
- [Documentation Index](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/README.md)
- [Architecture](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/ARCHITECTURE.md)
- [Current State](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/CURRENT_STATE.md)
- [Deployment](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/DEPLOYMENT.md)
- [Operations](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/OPERATIONS.md)
- [Testing Data](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/TESTING_DATA.md)
- [Roadmap](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/ROADMAP.md)

## Repo Layout

- [`app`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app): React/Vite product app
- [`supabase`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase): schema, migrations, edge functions
- [`site`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/site): static marketing site
- [`docs`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs): project documentation

## Local Development

App:

```bash
cd app
npm install
npm run dev
```

Quality checks:

```bash
cd app
npm run lint
npm run test
npm run build
```

Supabase:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy
```

See [Deployment](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/DEPLOYMENT.md) for the actual environment and deployment model.
