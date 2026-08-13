# Roadmap

Shopstart is a template, not a live product — there's no release train to plan around.
This doc is instead an honest snapshot of what's solid, what's thin, and what's
intentionally not here, so adopters and contributors both know what they're standing
on. Update it as state changes; stale roadmaps are worse than none.

## Solid

- **Domain model + business rules** — `User`, `Address`, `Category`, `Product`,
  `Review`, `Cart`, `Order`, `Wishlist` (backend), with the rules CONTEXT.md documents:
  transactional stock decrement at checkout, frozen `OrderItem`/address snapshots,
  verified-purchase-gated reviews.
- **Storefront design system** — a locked, documented dark theme (Apple
  product-page language, N6 newspaper-masthead nav) in `apps/web/design.md`. Every
  storefront page reads from it; amend the file first if a page needs to diverge.
- **Test coverage on the core purchase path** — 136 tests across the monorepo:
  - `apps/api`: unit tests for all 9 services (61 tests) + e2e tests (11 tests)
    covering the real auth/guard/cookie flow and, most importantly, the concurrent-
    checkout stock guarantee against a real Postgres database. See
    [`docs/adr/0006-testing-strategy.md`](./docs/adr/0006-testing-strategy.md) for why
    it's split this way.
  - `apps/web`: 56 tests — shared components, and the login/register/checkout/cart/
    product-listing/product-detail routes.
  - `apps/admin`: 8 tests — session + the `useRequireAdmin` access-control redirect.
- **Seed data** — 28 products across 4 categories, with placeholder images that are
  guaranteed to load (no dependency on a flaky third-party photo API) and honestly
  labeled with the product name rather than a random unrelated stock photo.

## Thin — good next contributions

Ranked roughly by how much it'd hurt if it broke silently:

1. **`RolesGuard` has no e2e proof.** `JwtAuthGuard` is proven for real (a request
   with no cookie gets a real 401). Admin-only routes (`GET /orders/admin`,
   `PATCH /products/:id`, etc.) are guarded by `@UseGuards(RolesGuard) @Roles(Role.ADMIN)`
   in the controllers, but no e2e test proves a non-admin actually gets a 403 from one
   — this is the guard doing the real authorization work in production and the least
   proven part of the auth story.
2. **`WishlistsService`/`WishlistsController` have zero test coverage** — every other
   backend module has a unit spec; this one was missed entirely.
3. **Admin app screens are untested.** `apps/admin/src/routes/{products,orders,users,
   categories}/index.tsx` — the actual product/order/user/category management UI —
   have no tests; only the shared session hooks do.
4. **Three web routes are untested**: the home page (`routes/index.tsx`), order
   history (`routes/account/orders.tsx`), and `__root.tsx`'s error/not-found
   boundaries.
5. **The Wishlist API has no storefront UI.** The backend module (list, create, add/
   remove items) is fully built and reachable, but neither `apps/web` nor
   `apps/admin` calls it anywhere yet — it's a complete feature with no way to use it.

## Deliberately not planned

These aren't gaps — they're documented scope boundaries. Don't pick them up without
first reading (and, if you disagree, revisiting) the linked decision:

- **A real payment gateway integration** (Stripe, etc.) — [ADR-0003](./docs/adr/0003-payment-interface-only.md).
  `PaymentProvider` is an interface on purpose; adopters implement it for whichever
  gateway they use.
- **Coupons/discounts, shipping-method calculation** — not modeled, per the
  README's "what you build" table. Every store's rules here are different enough
  that a generic implementation would be wrong for most adopters.
- **Multi-tenancy** — [ADR-0001](./docs/adr/0001-single-tenant-boilerplate.md). One
  deployment, one store.
