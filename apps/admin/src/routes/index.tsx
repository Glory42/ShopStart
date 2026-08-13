import { createFileRoute, Link } from "@tanstack/react-router";
import { useRequireAdmin } from "../lib/session";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isLoading } = useRequireAdmin();
  if (isLoading || !user) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome, {user.username}</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link to="/products" className="rounded-md border border-neutral-200 p-4">
          Products
        </Link>
        <Link to="/categories" className="rounded-md border border-neutral-200 p-4">
          Categories
        </Link>
        <Link to="/orders" className="rounded-md border border-neutral-200 p-4">
          Orders
        </Link>
        <Link to="/users" className="rounded-md border border-neutral-200 p-4">
          Users
        </Link>
      </div>
    </div>
  );
}
