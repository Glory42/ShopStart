import { Link } from "@tanstack/react-router";

const UTILITY_LINKS = [
  { label: "Shop", to: "/products" as const },
  { label: "Your cart", to: "/cart" as const },
  { label: "Orders", to: "/account/orders" as const },
  { label: "Wishlists", to: "/account/wishlists" as const },
  { label: "Log in", to: "/login" as const },
];

/**
 * Ft5 · Statement (design.md § Footer archetype). One closing line, wordmark
 * + a handful of real utility links beneath, copyright in muted small type.
 * Replaces the project's previous Ft3/Ft5 hybrid (4-column sitemap + giant
 * wordmark) — the 4-column pattern is anti-patterns.md's named "AI footer"
 * and this store doesn't have enough real destinations to justify it.
 */
export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="max-w-md text-[clamp(1.75rem,5vw,3rem)] font-semibold leading-[1.05] tracking-tightest text-ink">
          Everyday things, made to last.
        </p>

        <div className="mt-10 flex flex-col gap-6 border-t border-hairline pt-6 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-8">
            <span className="text-[15px] font-semibold text-ink">shopstart</span>
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              {UTILITY_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-sm text-[13px] text-graphite transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="text-[12px] text-graphite">
            <p>© {new Date().getFullYear()} shopstart · MIT licensed template · v0.1.0</p>
            <p className="mt-1">
              Built with NestJS, TanStack Start, Prisma, and Bun — see{" "}
              <code className="font-mono">CONTEXT.md</code> and{" "}
              <code className="font-mono">docs/adr/</code> in the repo.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
