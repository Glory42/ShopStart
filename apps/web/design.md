# Design — shopstart storefront

A locked design system for `apps/web`, produced by a Hallmark multi-page redesign
(2026-08-13). Every page redesign in this app reads this file before emitting
code. Extend or amend it when the system needs to grow — don't regenerate it
per page.

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
is the existing accent blue, not a catalog pick.

- `--color-paper`      oklch(98.9% 0.003 286.4)   (#fbfbfd — canvas)
- `--color-paper-2`    oklch(97.1% 0.003 286.4)   (#f5f5f7 — recessed surfaces, image plates)
- `--color-ink`        oklch(23.2% 0.004 286.1)   (#1d1d1f — primary text)
- `--color-ink-2`      oklch(54.0% 0.008 286.1)   (#6e6e73 — secondary text, "graphite")
- `--color-rule`       oklch(86.5% 0.007 286.3)   (#d2d2d7 — hairline borders)
- `--color-accent`     oklch(56.3% 0.193 256.2)   (#0071e3 — primary CTA, links)
- `--color-accent-hov` oklch(58.3% 0.199 256.0)   (#0077ed)
- `--color-accent-ink` oklch(47.0% 0.158 255.5)   (#0058b0 — dark-mode / pressed state reserve)
- `--color-focus`      oklch(56.3% 0.193 256.2)   (same as accent — one blue does both jobs)
- `--color-danger`     oklch(55.3% 0.225 27.3)    (#d70015 — Apple's system red; form/mutation error text only)

Diversification axes (for any future Hallmark run in this project to compare
against): **paper band** = light (98.9%) · **display style** = system-sans ·
**accent hue** = cool (256°, blue).

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
- Reduced motion: `prefers-reduced-motion` not yet wired at the CSS level —
  flagged as a follow-up, see Anti-pattern pass notes.

## Microinteractions stance
- Silent success on cart mutations (no toast) — the nav's live cart-count
  badge *is* the confirmation.
- Button hover: `translateY(-1px)` is intentionally **not** used on solid
  fills (reads as a dated "lift" tell) — hover is color-shift + `active:scale-[0.98]` only.
- `:focus-visible` ring uses `--color-focus` (the accent blue) at a visible
  1–2px offset ring — see Anti-pattern pass for current coverage gaps.

## CTA voice
- Primary CTA: filled pill, `--color-accent` background, white text, radius
  `9999px` (full pill) — the literal Apple Store "Add to Bag" shape.
- Secondary CTA: filled pill, `--color-ink` background (the "dark" variant) —
  used for non-purchase primary actions (Shop the collection, Save address).
- Tertiary: bordered pill, transparent fill, `--color-rule` border.
- Ghost/link CTA: accent-colored text + underline on hover, no box.

## Nav archetype
**N1b · Canonical SaaS three-section**, adapted for commerce (component-cookbook.md's
commerce row lists N1b as an acceptable alternate to N12; N12 was rejected
because it requires an invented promotional banner and this store has no real
promotion to advertise — inventing one would violate the honest-copy rule).
Grid `[1fr auto 1fr]`: wordmark hard-left · centered link cluster (Shop,
Orders when authenticated) · right cluster (Log in/out as text link, Cart as
a distinct pill showing live item count). **Scroll state: always-solid**, not
Hallmark's default frost-on-scroll — the storefront's hero is light, not a
full-bleed dark/photo hero, so a transparent-at-rest nav with light text
would be illegible over white. Kept the existing dark bar as the "solid"
state permanently instead. This deliberately replaces the project's previous
N1a-shaped nav (wordmark + inline link row + no real CTA), which is
`anti-patterns.md`'s named "AI nav" fingerprint.

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
  `/login`, `/register`, `/account/orders`): no macrostructure, no
  enrichment — function carries the page, per the app-page allowance below.
  These pages consume the same tokens, type, CTA voice, and nav/footer as the
  marketing page; they do not get their own structural fingerprint.

## What pages MUST share
- The wordmark, nav (N1b), footer (Ft5).
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
