import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@shopstart/types";
import { useSession } from "../lib/session";
import { api } from "../lib/api-client";

/**
 * N6 · Newspaper masthead (design.md § Nav archetype, revised 2026-08-13).
 * Replaces the previous N1b three-section bar — same centered-cluster shape
 * read as "plain" and the elevated grey glass bar read as low-contrast.
 * Masthead is N6's own genre default (this project's genre is editorial),
 * adapted for commerce: a thin utility line (Log in/out + Cart) stands in
 * for N6's issue-date line, a big centered wordmark anchors the page, Shop/
 * Orders/Wishlists sit beneath as the link row, and a double rule closes it — the
 * bottom rule in accent blue is the one signature color move. Deliberately
 * NOT sticky: a masthead is a one-time page opener, not a bar that chases
 * scroll (genuine newspaper convention) — Cart/Log in stay reachable via
 * the footer's utility row on long pages.
 */
export function Nav() {
  const { data: user } = useSession();
  const { data: cart } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get<Cart>("/cart"),
    enabled: Boolean(user),
  });
  const queryClient = useQueryClient();
  const router = useRouter();

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  async function logout() {
    await api.post("/auth/logout");
    queryClient.setQueryData(["session"], null);
    queryClient.removeQueries({ queryKey: ["cart"] });
    router.navigate({ to: "/" });
  }

  const navLinkClasses =
    "text-[13px] font-medium uppercase tracking-[0.08em] text-graphite transition-colors duration-150 hover:text-ink [&.active]:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm";

  return (
    <header className="border-b-0 bg-canvas px-5 pt-4 text-center">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 text-[11px] font-mono uppercase tracking-[0.08em] text-graphite">
        {user ? (
          <button
            onClick={logout}
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            Log out
          </button>
        ) : (
          <Link
            to="/login"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            Log in
          </Link>
        )}
        <span aria-hidden className="text-rule">
          ·
        </span>
        <Link
          to="/cart"
          className="flex items-center gap-1.5 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          Cart
          {cartCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      <Link
        to="/"
        className="mt-1 inline-block rounded-sm text-[clamp(2rem,5vw,3rem)] font-semibold leading-[0.95] tracking-tightest text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        shopstart
      </Link>

      <nav aria-label="Primary" className="mt-2 flex items-center justify-center gap-6">
        <Link to="/products" className={navLinkClasses}>
          Shop
        </Link>
        {user && (
          <Link to="/account/orders" className={navLinkClasses}>
            Orders
          </Link>
        )}
        {user && (
          <Link to="/account/wishlists" className={navLinkClasses}>
            Wishlists
          </Link>
        )}
      </nav>

      <div className="mx-auto mt-4 max-w-6xl border-t border-hairline">
        <div className="border-t-2 border-accent" />
      </div>
    </header>
  );
}
