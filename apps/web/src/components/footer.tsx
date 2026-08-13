import { Link } from "@tanstack/react-router";

const LINK_COLUMNS = [
  {
    heading: "Shop",
    links: [
      { label: "All products", to: "/products" as const },
      { label: "Your cart", to: "/cart" as const },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", to: "/login" as const },
      { label: "Create account", to: "/register" as const },
      { label: "Order history", to: "/account/orders" as const },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {LINK_COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="eyebrow mb-4">{column.heading}</p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-graphite transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-2">
            <p className="eyebrow mb-4">Built with</p>
            <p className="text-[13px] leading-relaxed text-graphite">
              NestJS, TanStack Start, Prisma, and Bun — a clone-and-build
              e-commerce template. See <code className="font-mono">CONTEXT.md</code>{" "}
              and <code className="font-mono">docs/adr/</code> in the repo for the
              domain model and architecture decisions.
            </p>
          </div>
        </div>

        <div className="mt-16 select-none text-[19vw] font-semibold leading-none tracking-tightest text-[#f5f5f7] sm:text-[11rem]">
          shopstart
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-hairline pt-6 text-[12px] text-graphite sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} shopstart. MIT licensed template.</p>
          <p className="font-mono">v0.1.0</p>
        </div>
      </div>
    </footer>
  );
}
