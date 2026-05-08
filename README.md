# SKIIP

SKIIP is a festival and venue ordering platform.

The current product supports:
- buyer signup/login and authenticated checkout
- vendor storefronts and live order handling
- Stripe Connect onboarding and Stripe Checkout
- webhook-driven payment finalization
- vendor/admin operational dashboards
- a separate marketing site maintained in the external repo [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing)

The source of truth for project documentation is the [`docs`](docs) directory.

Start here:
- [Documentation Index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Current State](docs/CURRENT_STATE.md)
- [Deployment](docs/launch/DEPLOYMENT.md)
- [Operations](docs/operations/OPERATIONS.md)
- [Branching Workflow](docs/delivery/BRANCHING_WORKFLOW.md)
- [GitHub Setup](docs/delivery/GITHUB_SETUP.md)
- [PR Review](docs/delivery/PR_REVIEW.md)
- [Testing Data](docs/operations/TESTING_DATA.md)
- [Roadmap](docs/ROADMAP.md)

## Repo Layout

- [`app`](app): React/Vite product app
- [`supabase`](supabase): schema, migrations, edge functions
- [`docs`](docs): project documentation

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

See [Deployment](docs/launch/DEPLOYMENT.md) for the actual environment and deployment model.
