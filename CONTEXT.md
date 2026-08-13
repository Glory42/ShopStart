# Shopstart

Shopstart is a generic e-commerce site template. Adopters clone the repo, rename it, and build their own single-tenant storefront on top of it — this is not a multi-tenant platform.

## Language

**Cart**:
A mutable collection of `CartItem`s belonging to a single user, held before checkout. Prices are not locked in — they reflect the current `Product` price.
_Avoid_: Basket, bag

**CartItem**:
A `Product` plus a quantity within a `Cart`.

**Order**:
An immutable record created at checkout from a `Cart`. Contains one or more `OrderItem`s. Once created, its line items and their prices never change even if the underlying `Product` changes later. Has a single `status`: `PENDING → PAID → SHIPPED → DELIVERED`, with `CANCELLED` and `REFUNDED` as terminal states reachable from earlier ones. Not represented as independent booleans.
_Avoid_: Purchase, transaction

**OrderItem**:
A line item within an `Order`: a snapshot of a `Product`'s price and details at the moment of purchase, plus quantity. Distinct from `CartItem` in that its price is frozen.

**Address**:
A saved shipping/billing address (`line1`, `line2`, `city`, `state`, `postalCode`, `country`) belonging to a `User`. A user may save multiple. An `Order` stores a snapshot of the address used at checkout, so later edits to the saved `Address` don't rewrite historical orders — same snapshot principle as `OrderItem`.

**Wishlist**:
A named collection of `WishlistItem`s belonging to a `User` (e.g. "Birthday", "Home office"). A user may have multiple. No checkout path — purely a saved-for-later list.

**WishlistItem**:
A `Product` saved within a `Wishlist`, with the timestamp it was added.

**Checkout**:
The act of converting a `Cart` into an `Order`, snapshotting current product prices into `OrderItem`s and clearing the cart.

**Category**:
A flat (non-nested) grouping that a `Product` belongs to. Own entity with `id`, `name`, `slug` — not a free-text field on `Product`.

**Payment**:
A record of a charge attempt against an `Order`, with status `PENDING/SUCCEEDED/FAILED`. The template defines the shape and a `PaymentProvider` interface only — no real gateway (Stripe, etc.) is wired up. Adopters implement the interface against whichever provider they use.

**Product**:
An item for sale. Belongs to one `Category`. Tracks stock as `stockQuantity` (an integer), not a boolean flag — "in stock" is derived from `stockQuantity > 0`. Decremented transactionally at `Checkout` to prevent overselling under concurrent purchases. Has a single `imageUrl` string field — the template has no upload pipeline or storage provider; adopters point it at wherever they host images.

**Review**:
A rating (1–5) plus comment left by a `User` on a `Product`. Own entity — not data merged into the `Product` row. A user may only review a product they have a delivered `OrderItem` for ("verified purchase"), and only once per product.
