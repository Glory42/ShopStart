# Design — shopstart storefront

A locked design system for `apps/web`, produced by a Hallmark multi-page redesign
(2026-08-13). Every page redesign in this app reads this file before emitting
code. Extend or amend it when the system needs to grow — don't regenerate it
per page.

**Revision (2026-08-13, same day):** flipped from a light paper (`#fbfbfd`) to
a full dark theme (`#000000`) at explicit user request ("i do not want white
bg"). This is an amendment to the locked system per redesign.md's multi-page
rule ("amend `design.md` first, not override locally") — the Theme block
below is the *current* source of truth; the paper band axis changed from
light to dark but genre, macrostructures, nav/footer archetypes, typography,
motion, and CTA voice are unchanged. Diversification axes updated accordingly.

**Revision (2026-08-17):** added the Wishlist save toggle (new CTA voice
subsection below) plus a third nav/footer link row entry (`/account/wishlists`)
for issue #15. This is an amendment, not a redesign — the existing four CTA
voices (primary/secondary/tertiary/ghost) are all pill-shaped commitments to
an action ("Add to bag", "Place order"); "save" is a toggle a shopper flips
and reconsiders, not a commitment, so it gets its own icon-toggle voice
rather than being force-fit into "tertiary". Genre, theme, typography,
motion, and every other archetype are unchanged.

Scope: the customer-facing storefront (`apps/web`) only. `apps/admin` is a
separate authenticated tool and is out of scope for this pass.

**Documented deviation from Hallmark's typography default:** this project is a
*template* other developers clone — it deliberately ships zero external font
loading (no Google Fonts, no `next/font` network fetch) so it works offline
and has no first-load font-swap flash. The system font stack (`-apple-system`
/ SF Pro on Apple devices, Segoe UI on Windows, Roboto on Android) is kept as
the **display + body face** in place of a licensed pairing. This is a
technical constraint, not an aesthetic default — noted here so future
Hallmark runs don't "fix" it back to a Google Fonts import.

## Genre
editorial (quiet, typographic, restrained — closest fit; no signal fired for
modern-minimal/atmospheric/playful, and the existing approved visual language
is closer to Apple's product pages than to SaaS-marketing or dark-AI-tool
energy)

## Theme
Custom — continuing the already-established, user-approved palette rather
than switching to a catalog theme (redesign.md: "preserve the brand"). Anchor
is the existing accent blue, not a catalog pick. Values below are Apple's own
Dark Mode HIG semantic colors, mapped onto our token names — this keeps the
"real Apple product page" fingerprint intact through the light→dark flip
rather than inventing an unrelated dark palette.

- `--color-paper`      oklch(0.0% 0.000 0.0)      (#000000 — true black canvas)
- `--color-paper-2`    oklch(22.7% 0.004 286.1)    (#1c1c1e — elevated surfaces: nav bar, image plates, status chips)
- `--color-paper-3`    oklch(29.4% 0.004 286.2)    (#2c2c2e — reserved for a further-elevated surface, e.g. modals)
- `--color-ink`        oklch(97.1% 0.003 286.4)    (#f5f5f7 — primary text; off-white, not pure white, to avoid vibration against true black)
- `--color-ink-2`      oklch(68.1% 0.007 286.2)    (#98989d — secondary text, "graphite")
- `--color-rule`       oklch(34.1% 0.003 286.2)    (#38383a — hairline borders/separators)
- `--color-accent`     oklch(62.4% 0.206 255.5)    (#0a84ff — Apple's dark-mode system blue, brighter than the light-mode #0071e3 for contrast against black)
- `--color-accent-hov` oklch(68.5% 0.170 253.0)    (#409cff)
- `--color-accent-ink` oklch(50.1% 0.171 256.0)    (#0060c2 — pressed state)
- `--color-focus`      oklch(62.4% 0.206 255.5)    (same as accent)
- `--color-danger`     oklch(66.3% 0.224 28.3)     (#ff453a — Apple's dark-mode system red)
- `--color-warning`    (#ff9f0a — Apple's dark-mode system orange; order-status "pending" chip)
- `--color-success`    (#30d158 — Apple's dark-mode system green; order-status "delivered" chip)

Diversification axes (for any future Hallmark run in this project to compare
against): **paper band** = dark (0%, was light 98.9%) · **display style** =
system-sans (unchanged) · **accent hue** = cool (255°, blue — unchanged hue,
brightened for contrast).

## Typography
- Display: system-ui stack (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Helvetica, Arial, sans-serif`), weight 600
- Body: same stack, weight 400
- Mono (eyebrows/labels/prices-as-data only, never body copy): `"SF Mono", "JetBrains Mono", ui-monospace, Menlo, monospace`
- Display tracking: `-0.04em` at large sizes (`tracking-tightest`)
- Type scale anchor: hero `text-6xl` → `text-7xl` (clamp-equivalent via Tailwind responsive classes, not a raw `clamp()` — the project doesn't use arbitrary CSS)

## Spacing
Tailwind's default 4px-based scale, used directly (`px-5`, `py-14`, `gap-6`,
etc.) rather than a hand-rolled `--space-*` custom-property set — the project
is Tailwind-native and a parallel token system would fight the utility
classes instead of composing with them.

## Motion
- Easings: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (entrances — already in
  `tailwind.config.ts` via the `fade-up` animation), `ease-in`/`ease-in-out`
  reserved for future exit/toggle transitions, not yet used.
- Durations: micro 120ms (button press/hover), short 220ms (menu/dropdown),
  long 420ms (page-load reveal — matches the existing `fade-up: 0.7s` hero
  entrance, rounded up from Hallmark's 420ms ceiling for a calmer first paint).
- Reveal pattern: fade + 16px translateY on hero copy only, staggered by
  ~100ms per line. No scroll-triggered reveals on product grids (would delay
  perceived load on a page whose job is "show me the products").
- Reduced motion: wired at the CSS level (`src/styles.css`, global
  `@media (prefers-reduced-motion: reduce)` block clamping all
  animation/transition durations to 150ms). Verified 2026-08-13 — an earlier
  note here calling this a follow-up was stale.

## Microinteractions stance
- Silent success on cart mutations (no toast) — the nav's live cart-count
  badge *is* the confirmation.
- Button hover: `translateY(-1px)` is intentionally **not** used on solid
  fills (reads as a dated "lift" tell) — hover is color-shift + `active:scale-[0.98]` only.
- `:focus-visible` ring uses `--color-focus` (the accent blue) at a visible
  1–2px offset ring. Coverage confirmed complete (2026-08-13): product cards
  and footer utility links were missing the ring — both now carry it.

## CTA voice
- Primary CTA: filled pill, `--color-accent` background, white text, radius
  `9999px` (full pill) — the literal Apple Store "Add to Bag" shape.
- Secondary CTA: filled pill, `--color-ink` background (the "dark" variant) —
  used for non-purchase primary actions (Shop the collection, Save address).
- Tertiary: bordered pill, transparent fill, `--color-rule` border.
- Ghost/link CTA: accent-colored text + underline on hover, no box.

## Wishlist save toggle
Added 2026-08-17 for issue #15 (storefront wishlist UI) — a fifth, distinct
interactive voice for the one save/un-save action, not a variant of the four
pill CTAs above.

- **Glyph, not a new icon set.** ♥ filled / ♡ outline — the same
  typographic-glyph iconography the product-detail page already uses for
  star ratings (★/☆), so this doesn't introduce an icon library or SVG set
  the project didn't already have.
- **Icon form** (product cards): a circular button in the same slot/treatment
  as the existing out-of-stock badge — `bg-canvas/85` + backdrop-blur, top
  corner of the image plate (opposite corner from the out-of-stock badge, so
  the two never collide). `--color-graphite` outline, `--color-accent` when
  saved. Rendered as a *sibling* of the card's `<Link>`, not nested inside
  it — nesting a `<button>` inside the card's own `<a>` would be invalid
  interactive-in-interactive markup.
- **Labeled form** (product-detail buy-box): a bordered pill matching
  Tertiary's weight (`--color-rule` border, transparent fill) sitting beside
  the primary "Add to bag" pill — border/text flip to `--color-accent` when
  saved.
- **Signed-out state:** the toggle becomes a plain link to `/login` (still
  the outline glyph) rather than a disabled control or a silent no-op —
  consistent with the rest of the app not gating navigation behind
  client-side auth checks.
- **Picking a wishlist:** clicking the toggle opens a small popover
  (`--color-paper-3` — the surface this file already reserved for "a
  further-elevated surface, e.g. modals" — used here since the project has
  no modal component yet and a popover is the lighter-weight fit for a
  one-off "which list?" choice) listing the user's wishlists as checkboxes
  (a product can live in more than one list) plus an inline
  create-a-new-wishlist field. No page navigation, no toast — silent
  success per the existing Microinteractions stance, same as cart.

## Nav archetype
**N6 · Newspaper masthead** (revised 2026-08-13, replacing N1b — user
feedback: the three-section bar read as flat in shape, plainness, and
color/contrast all at once). N6 is this project's genre's own default
(editorial), so this is a return to the genre's home archetype rather than a
one-off swap. Structure: a thin mono small-caps utility line stands in for
N6's issue-date line (Log in/out left-of-center, Cart with live count
right-of-center, joined by a middot) · a large centered wordmark anchors the
page · Shop/Orders/Wishlists (when authenticated) sit beneath as the link
row · a
double rule closes the block, with the bottom rule rendered in
`--color-accent` as the one signature color move (was all-hairline grey
before). Chrome is `bg-canvas` (true black), not the previous
`bg-paper-2/90` frosted-grey bar — crisper contrast against the page, no
elevated-surface smudge.

**Deliberately not sticky.** A masthead is a one-time page opener in
newspaper convention, not a bar that chases scroll — this also matches the
"Everyday things, made to last." editorial hero language already in place.
Cart/Log in stay reachable via the footer's utility row on longer pages
(product grid, orders). This is a real trade-off (persistent cart access is
gone while scrolling) — flagged here rather than left silent; revisit if it
turns out to hurt cart completion.

This replaces the project's previous N1a-shaped nav (before N1b), and now
N1b itself — three navs in this project's history, each addressing a
concrete complaint rather than swapped for novelty.

## Footer archetype
**Ft5 · Statement**, refined from the project's previous Ft3/Ft5 hybrid (link
columns + oversized wordmark, which mixed two archetypes). Now genuinely Ft5:
one closing statement line, wordmark beneath it, minimal utility links and
copyright in muted small type — no 4-column sitemap (that pattern is
`anti-patterns.md`'s named "AI footer" and this store doesn't have enough
real destinations to justify it honestly).

## Per-page treatment
- **Marketing page** (home `/`): macrostructure = **Catalogue** (component-cookbook's
  literal example content is "product SKUs" — the page's job is a hero
  statement + an honest visual index of the catalog, not a SaaS feature
  pitch). Enrichment: none (typography + real product imagery only).
- **App pages** (`/products`, `/products/$id`, `/cart`, `/checkout`,
  `/login`, `/register`, `/account/orders`, `/account/wishlists`): no macrostructure, no
  enrichment — function carries the page, per the app-page allowance below.
  These pages consume the same tokens, type, CTA voice, and nav/footer as the
  marketing page; they do not get their own structural fingerprint.

## What pages MUST share
- The wordmark, nav (N6), footer (Ft5).
- The accent colour and its placement (primary CTA only — not decorative).
- The system-sans type stack, CTA voice, spacing scale.

## What pages MAY differ on
- The marketing page may use a bigger display scale for its hero than app
  pages use for their `<h1>`s.
- Product-detail's buy-box layout is unique to that page (not shared with
  cart/checkout) since it's solving a different problem (single-item
  decision vs. multi-item review).

## Exports
No `tokens.css` / DTCG / shadcn export set was generated — the project is
Tailwind-native (`tailwind.config.ts` + a small `@layer utilities` block in
`styles.css` already **is** the token system in the format this codebase
actually consumes). Generating a parallel `tokens.css` the app doesn't import
would be dead weight. The OKLCH values above are the canonical source; if a
future project needs a portable export, derive it from this file's Theme
section, not from `tailwind.config.ts` (which stores Tailwind-resolved
values, e.g. still hex, for editor tooling compatibility).
