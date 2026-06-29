# Tsuly

**Build your brand in five minutes a day.**

[Tsuly.com](https://tsuly.com) is a SaaS that makes short-form content creation easier. Film yourself reading a transcript, validate the result, and post automatically — without the usual friction of ideation, scripting, filming, and editing.

## How it works

### For creators

1. **Film** — Read a transcript on a built-in teleprompter while you record.
2. **Validate** — Review the take and approve when you're happy.
3. **Publish** — Tsuly posts automatically to your connected channels.

### Under the hood

1. **Ideation** — AI asks about your brand, ICP, positioning, and goals to generate content ideas tailored to you.
2. **Scripting** — Generates a video transcript and tells you exactly what to film.
3. **Recording** — You film yourself reading the teleprompter and upload the footage.
4. **Editing** — Automatic captions, smart cuts, and silence removal polish the video before you validate.

## Tech stack

- AdonisJS 7
- React + TanStack Router & Query
- Tuyau for type-safe API calls + @tuyau/react-query for React Query integration
- Tailwind CSS & Shadcn UI
- PostgreSQL 18
- Turborepo & PNPM for monorepo management
- Oxlint & Oxformat for fast linting/formatting
- Module-based folder structure

## Getting started

### Installation

1. Clone the repo:
   ```bash
   git clone <repository-url>
   cd tsuly
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the database:
   ```bash
   docker compose up -d
   ```
4. Run migrations:
   ```bash
   cd apps/api
   node ace migration:run
   ```
5. Start the dev servers:
   ```bash
   pnpm dev
   ```

The API will be running at `http://localhost:3333` and the frontend at `http://localhost:5173`.

### Stripe billing (optional)

1. Create a product + recurring price in the [Stripe Dashboard](https://dashboard.stripe.com/test/products).
2. Add to `apps/api/.env`:
   ```
   FRONTEND_URL=http://localhost:5173
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PRO=price_...
   ```
3. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3333/billing/webhook
   ```
4. Run the migration if you haven't: `cd apps/api && node ace migration:run`
5. Visit `/pricing` to subscribe, `/dashboard` to manage billing.

## Project structure

```
apps/
  api/   # AdonisJS backend
  app/   # React frontend
compose.yaml
turbo.json
pnpm-workspace.yaml
```

## Useful scripts

- `pnpm dev` – start everything in dev mode
- `pnpm build` – build both front and back
- `pnpm lint` – lint the whole project
- `pnpm format` – format code with Oxformat

---

MIT License
