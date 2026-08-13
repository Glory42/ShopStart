import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@shopstart/types";
import { useSession } from "../lib/session";
import { api } from "../lib/api-client";

/**
 * N1b · Canonical SaaS three-section, adapted for commerce (design.md § Nav
 * archetype). Grid [1fr auto 1fr]: wordmark · centered link cluster · Log
 * in/out + Cart pill. Always-solid (not frost-on-scroll) — see design.md for
 * why. Replaces the project's previous N1a-shaped nav (the named "AI nav"
 * fingerprint in anti-patterns.md).
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

  const linkClasses =
    "text-[13px] font-medium text-neutral-300 transition-colors duration-150 hover:text-white [&.active]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1d1d1f]/95 backdrop-blur-xl">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5">
        <Link
          to="/"
          className="justify-self-start text-[15px] font-semibold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm"
        >
          shopstart
        </Link>

        <nav className="flex items-center justify-self-center gap-7">
          <Link to="/products" className={linkClasses}>
            Shop
          </Link>
          {user && (
            <Link to="/account/orders" className={linkClasses}>
              Orders
            </Link>
          )}
        </nav>

        <div className="flex items-center justify-self-end gap-5">
          {user ? (
            <button
              onClick={logout}
              className="text-[13px] font-medium text-neutral-300 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm"
            >
              Log out
            </button>
          ) : (
            <Link to="/login" className={linkClasses}>
              Log in
            </Link>
          )}
          <Link
            to="/cart"
            className="flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors duration-150 hover:border-white/50 [&.active]:border-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Cart
            {cartCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-none text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
