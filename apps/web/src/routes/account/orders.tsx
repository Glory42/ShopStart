import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shopstart/types";
import { api } from "../../lib/api-client";

export const Route = createFileRoute("/account/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => api.get<Order[]>("/orders"),
  });

  if (isLoading) return <p>Loading orders...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Your orders</h1>
      {orders?.length === 0 && <p className="text-neutral-500">No orders yet.</p>}
      <ul className="space-y-4">
        {orders?.map((order) => (
          <li key={order.id} className="rounded-md border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Order {order.id.slice(0, 8)}</p>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                {order.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              {order.items.length} item(s) — ${order.totalPrice.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
