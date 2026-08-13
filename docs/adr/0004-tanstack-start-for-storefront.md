# TanStack Start (SSR) for the storefront, not a client-only SPA

`apps/web`, the public storefront, is built on TanStack Start rather than TanStack Router alone in SPA mode. Product and category pages need to be crawlable and fast on first paint for SEO and conversion — a client-only SPA ships a near-empty HTML shell and relies entirely on client-side data fetching, which is a poor foundation for pages whose whole job is to be found and to convert.

The tradeoff is that `apps/web` now runs as its own Bun server (rather than being pure static output), which is more than a minimal template might otherwise need. We accepted this because SSR is close to a hard requirement for a real storefront, not a nice-to-have — it's the reason `apps/admin` (authenticated, never indexed) is deliberately kept as a plain SPA with TanStack Router instead of also using Start.
