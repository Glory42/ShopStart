import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@shopstart/types";
import { useSession } from "../lib/session";
import { api } from "../lib/api-client";

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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-11 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="text-[15px] font-semibold tracking-tight text-white">
          shopstart
        </Link>
        <div className="flex items-center gap-7 text-[13px] font-normal text-neutral-300">
          <Link
            to="/products"
            className="transition-colors hover:text-white [&.active]:text-white"
          >
            Shop
          </Link>
          {user && (
            <Link
              to="/account/orders"
              className="transition-colors hover:text-white [&.active]:text-white"
            >
              Orders
            </Link>
          )}
          <Link
            to="/cart"
            className="relative transition-colors hover:text-white [&.active]:text-white"
          >
            Cart
            {cartCount > 0 && (
              <span className="ml-1 text-white">({cartCount})</span>
            )}
          </Link>
          {user ? (
            <button onClick={logout} className="transition-colors hover:text-white">
              Log out
            </button>
          ) : (
            <Link to="/login" className="transition-colors hover:text-white">
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
