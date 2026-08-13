# shopstart

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![License](https://img.shields.io/github/license/Glory42/E-Commerce-API?style=for-the-badge)

**shopstart** is a clone-and-build e-commerce site template. It's not a store — it's a
starting point: a working storefront, admin dashboard, and API with the boring parts
(auth, cart, checkout, orders, inventory) already correct, so you can rename it and
build your actual store on top instead of starting from a blank repo.

> Use this as a GitHub template ("Use this template" button) or `git clone` it directly.

## Tech stack

- **API** — [NestJS](https://nestjs.com/) + [Prisma](https://www.prisma.io/) + PostgreSQL
- **Storefront** (`apps/web`) — [TanStack Start](https://tanstack.com/start) (SSR, for SEO)
- **Admin dashboard** (`apps/admin`) — [TanStack Router](https://tanstack.com/router) (client-only SPA)
- **Runtime** — [Bun](https://bun.sh/)
- **Monorepo** — [Turborepo](https://turbo.build/) + Bun workspaces

See [`docs/adr/`](./docs/adr) for why these were chosen over the alternatives, and
[`CONTEXT.md`](./CONTEXT.md) for the domain glossary (Cart vs Order, what a Review
requires, how Order status transitions work, etc).

## Folder structure

```
shopstart/
├── apps/
│   ├── api/      # NestJS REST API (Prisma + PostgreSQL)
│   ├── web/      # TanStack Start storefront (SSR)
│   └── admin/    # TanStack Router admin dashboard (SPA)
├── packages/
│   └── types/    # Shared Zod schemas + TS types, used by all three apps
├── docs/adr/     # Architecture decision records
└── CONTEXT.md    # Domain glossary
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [Docker](https://www.docker.com/) (for local PostgreSQL) — or point `DATABASE_URL`
  at any Postgres instance you already have

### 1. Install dependencies

```bash
bun install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment variables

Copy the example env files and fill in real secrets for `JWT_ACCESS_SECRET` /
`JWT_REFRESH_SECRET` (`openssl rand -base64 32`):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

### 4. Run migrations and seed demo data

```bash
bun run db:migrate
bun run seed
```

This creates a demo admin (`admin@shopstart.dev` / `shopstart-admin`) and a demo
customer (`customer@shopstart.dev` / `shopstart-customer`), plus a handful of
categories and products.

### 5. Start everything

```bash
bun run dev
```

- API: http://localhost:4000 (Swagger docs at `/docs`)
- Storefront: http://localhost:3000
- Admin: http://localhost:3001

## What's included vs. what you build

shopstart ships a complete domain model — `User`, `Address`, `Category`, `Product`,
`Review`, `Cart`, `Order`, `Wishlist` — with real business rules (stock decrements
transactionally at checkout, order prices are snapshotted so they never change
retroactively, reviews require a verified purchase). See `CONTEXT.md` for the full
glossary.

It deliberately leaves some things as extension points rather than guessing at your
specific store's needs:

| Area | What shopstart gives you | What you add |
|---|---|---|
| Payments | A `PaymentProvider` interface + a stub that auto-succeeds for local dev | A real gateway integration (Stripe, etc.) — see `docs/adr/0003` |
| Product images | An `imageUrl` string field | Wherever you want to host images — no upload pipeline is built in |
| Coupons / discounts | Not modeled | Your own pricing rules, if you need them |
| Shipping methods | Not modeled | Flat-rate, carrier-calculated, etc., per your store |

## Testing

- `apps/api` — Jest (`bun run --cwd apps/api test`)
- `apps/web`, `apps/admin`, `packages/*` — Vitest (`bun run --cwd apps/web test`)
- `bun run test` runs all of the above via Turborepo

## License

MIT — see [LICENSE](./LICENSE).
