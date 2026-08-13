import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { buttonClasses } from "../../components/button";
import { cn } from "../../lib/cn";

export const Route = createFileRoute("/account/orders")({
  component: OrdersPage,
});

const STATUS_STYLES: Record<Order["status"], string> = {
  PENDING: "bg-[#fff4e5] text-[#a35a00]",
  PAID: "bg-[#e5f2ff] text-accent",
  SHIPPED: "bg-[#e5f2ff] text-accent",
  DELIVERED: "bg-[#e6f7ec] text-[#1a7f43]",
  CANCELLED: "bg-[#f5f5f7] text-graphite",
  REFUNDED: "bg-[#f5f5f7] text-graphite",
};

function OrdersPage() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => api.get<Order[]>("/orders"),
  });

  if (isLoading) {
    return (
      <div className="px-5 py-24 text-center text-[15px] text-graphite">
        Loading orders...
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="px-5 py-28 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">No orders yet</h1>
        <p className="mt-3 text-[15px] text-graphite">
          Once you place an order, you'll be able to track it here.
        </p>
        <Link to="/products" className={cn(buttonClasses("dark"), "mt-7 inline-flex")}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="mb-10 text-4xl font-semibold tracking-tight text-ink">
        Your orders
      </h1>
      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-2xl border border-hairline p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[13px] text-graphite">
                  #{order.id.slice(0, 8)}
                </p>
                <p className="mt-1 text-[15px] text-ink">
                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium",
                  STATUS_STYLES[order.status],
                )}
              >
                {order.status}
              </span>
            </div>

            <ul className="mt-5 divide-y divide-hairline border-t border-hairline">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-3 text-[14px]"
                >
                  <span className="text-ink">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="text-graphite">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4 text-[15px] font-medium text-ink">
              <span>Total</span>
              <span>${order.totalPrice.toFixed(2)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
