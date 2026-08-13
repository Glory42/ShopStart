import { Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../lib/session";
import { api } from "../lib/api-client";

export function Nav() {
  const { data: user } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  async function logout() {
    await api.post("/auth/logout");
    queryClient.setQueryData(["session"], null);
    router.navigate({ to: "/" });
  }

  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-semibold">
          shopstart
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/products">Shop</Link>
          <Link to="/cart">Cart</Link>
          {user ? (
            <>
              <Link to="/account/orders">Orders</Link>
              <button onClick={logout} className="text-neutral-500">
                Log out
              </button>
            </>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
