# Contributing to shopstart

Thanks for taking the time to contribute! Check [`ROADMAP.md`](./ROADMAP.md) first —
it lists known-thin areas (untested modules, missing UI) that are good starting
points, and scope boundaries that are deliberate rather than gaps.

## Development workflow

1. **Fork the repository** to your own GitHub account.
2. **Clone the project** and run `bun install` at the repo root.
3. **Create a branch** for your fix or feature:
   ```bash
   git checkout -b feat/amazing-new-feature
   # or
   git checkout -b fix/annoying-bug
   ```
4. **Make your changes** and test them locally (`bun run dev`, `bun run test`).
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add support for saved payment methods"
   ```
6. **Push your branch** and open a Pull Request.

## Code style & standards

- **Runtime:** [Bun](https://bun.sh/). Please don't commit `package-lock.json` or `yarn.lock`.
- **TypeScript:** strict typing throughout. Avoid `any` unless there's a real reason.
- **Domain terms:** if a change touches the domain model (Cart, Order, Review, etc.),
  read [`CONTEXT.md`](./CONTEXT.md) first and update it if the model changes.
- **Architecture decisions:** hard-to-reverse, non-obvious technical choices belong in
  [`docs/adr/`](./docs/adr) — see existing ADRs for the format.
- **Storefront UI:** `apps/web` follows a locked design system —
  [`apps/web/design.md`](./apps/web/design.md). Read it before touching layout, color,
  or component styling; amend it first if a change genuinely needs to diverge, rather
  than drifting the UI page-by-page.

## Testing conventions

See [`docs/adr/0006-testing-strategy.md`](./docs/adr/0006-testing-strategy.md) for the
full rationale. In short:

- **`apps/api` unit tests** (`*.spec.ts`, Jest): one spec file per service. Mock
  `PrismaService` only — it's the real external boundary (the database). Don't mock
  other services; wire in real instances the way `orders.service.spec.ts` wires in a
  real `CartService`/`AddressesService`.
- **`apps/api` e2e tests** (`test/*.e2e-spec.ts`, Jest + Supertest): boot the real Nest
  app against a dedicated `shopstart_test` Postgres database (see the "API e2e tests"
  section of the [README](./README.md#api-e2e-tests) for one-time setup). Use these
  for anything a mock can't prove: guard/auth enforcement, request validation, and
  especially concurrency — the checkout stock guard is only meaningfully tested this
  way. Spec files share one database and must run with `maxWorkers: 1`; don't remove
  that from `jest-e2e.json`.
- **`apps/web`/`apps/admin` tests** (`*.test.tsx`, Vitest + `@testing-library/react`):
  component tests stub `@tanstack/react-router`'s `Link`/`useNavigate` directly. Route
  components that call `Route.useLoaderData()` or `Route.useSearch()` need the real
  router — use `apps/web/src/test-router.tsx`'s `renderRoute()` helper rather than
  trying to stub those hooks.

## Before submitting a PR

- `bun run lint`, `bun run typecheck`, and `bun run test` all pass.
- `bun run build` succeeds for all three apps.
- If your change touches auth, cart, checkout, orders, or stock, also run the API e2e
  suite (`bun run --cwd apps/api test:e2e`) — the unit suite alone can't catch
  concurrency or guard regressions in that area.
- The relevant flow works end-to-end locally (register → browse → cart → checkout,
  or the admin equivalent).

## Reporting bugs

Please include steps to reproduce, expected vs. actual behavior, and any relevant
log output.

Happy coding!
