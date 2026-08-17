import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "../lib/session";
import { api } from "../lib/api-client";
import { Button } from "./button";

export function Nav() {
  const { data: user } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!user) return null;

  async function logout() {
    await api.post("/auth/logout");
    queryClient.setQueryData(["session"], null);
    navigate({ to: "/login" });
  }

  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-semibold">
          shopstart admin
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/products">Products</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/users">Users</Link>
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </nav>
    </header>
  );
}
