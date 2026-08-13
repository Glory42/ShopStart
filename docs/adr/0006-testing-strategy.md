# Testing strategy: mocked unit tests + a real-database e2e layer

Shopstart tests at three levels, each catching a different class of bug, rather than
relying on one style of test everywhere.

**API unit tests** (`apps/api/src/**/*.spec.ts`, Jest + `@nestjs/testing`). One spec
file per service. `PrismaService` is mocked — it's the genuine external boundary (the
database) — but internal collaborators are not: `OrdersService`'s tests wire in real
`CartService`/`AddressesService` instances (with the same mocked `PrismaService`
underneath) rather than mocking them, per the project's own rule that mocking is for
system boundaries, not your own classes. These tests are fast and prove business logic
(validation, state transitions, error cases) is *constructed* correctly.

**API e2e tests** (`apps/api/test/*.e2e-spec.ts`, Jest + Supertest, against a real
Postgres). We considered stopping at mocked unit tests — they're faster and need no
database — but rejected that as the only layer: a mocked `PrismaService` can prove a
Prisma call is built correctly, never that it *behaves* correctly against a real
database. Concretely, `OrdersService.checkout`'s stock guard
(`stockQuantity: { gte: item.quantity }` inside a transaction) is the mechanism that
stops two concurrent checkouts from overselling the same unit — unit-testing it with a
mock can only assert the WHERE clause was constructed with the right shape; it cannot
prove Postgres actually serializes two simultaneous transactions racing for the same
row. `apps/api/test/checkout-concurrency.e2e-spec.ts` fires two real concurrent
checkout requests at a real database and asserts exactly one wins — this was verified
to actually catch that class of regression (removing the guard makes both requests
succeed and the product oversells) in a way no mocked test can. e2e tests also cover
`JwtAuthGuard` and the Zod validation pipes for real, since those only exist at the
HTTP layer and unit tests calling services directly never touch them.

e2e tests run against a **separate `shopstart_test` database** (own `.env.test`, see
`apps/api/.env.test.example`), not the dev database — so running the suite doesn't
clobber whatever you're poking at manually in `bun run dev`. They run with
`maxWorkers: 1` (`apps/api/test/jest-e2e.json`): every spec file truncates and reuses
the same shared database in `afterEach`, so running spec files in parallel workers
causes cross-file races (confirmed empirically — the initial version of this suite,
run with Jest's default parallel workers, produced spurious failures from two spec
files truncating tables out from under each other).

**Frontend tests** (`apps/web`, `apps/admin`, Vitest + `@testing-library/react`).
Component tests (`Button`, `Nav`, `ProductCard`, etc.) render in isolation; where a
component uses `@tanstack/react-router`'s `Link`/`useNavigate`, those are stubbed
since the component's own logic — not the router library — is what's under test.
**Route components are different**: `products/index.tsx` and `products/$productId.tsx`
call `Route.useLoaderData()`/`Route.useSearch()`, which only work inside a real router
context, not something a simple hook stub can fake. `apps/web/src/test-router.tsx`
mounts the app's actual `routeTree` (from `routeTree.gen.ts`) via a real `createRouter`
with in-memory history, so route loaders genuinely run and search-param navigation
genuinely works — only `fetch` is mocked. Login/register/checkout route components
don't need this heavier harness (no loader, no search params) and instead extract
`Route.options.component` directly with `Link`/`useNavigate` stubbed, same as the
plain component tests.

## What we rejected

- **Mocked unit tests as the only backend layer** — see the concurrency argument
  above; rejected because it cannot prove the one guarantee CONTEXT.md names
  explicitly ("prevent overselling under concurrent purchases").
- **A shared dev/test database for e2e** — rejected because it makes the suite
  destructive to run locally (it truncates tables) and non-repeatable (state from a
  previous manual test session pollutes assertions).
- **Testcontainers or another ephemeral-Postgres-per-run tool** — would remove the
  one-time `CREATE DATABASE shopstart_test` setup step, but adds a dependency and
  Docker-in-test-runner requirement to a template whose whole premise is being easy to
  read and adopt. The one-time setup cost was judged worth avoiding that.
- **Mocking `Link`/`useNavigate` for route components with loaders** — tried first;
  rejected because `useLoaderData`/`useSearch` aren't simple hooks you can stub the
  same way, they read from the nearest matched route in a real router tree.
