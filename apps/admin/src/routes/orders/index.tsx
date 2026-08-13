import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@shopstart/types";
import { ORDER_STATUS_TRANSITIONS, OrderStatus } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { useRequireAdmin } from "../../lib/session";

export const Route = createFileRoute("/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const { isLoading: authLoading, user } = useRequireAdmin();
  const queryClient = useQueryClient();
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => api.get<Order[]>("/orders/admin"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  if (authLoading || !user) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Orders</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2">Order</th>
            <th>Total</th>
            <th>Status</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {orders?.map((order) => {
            const nextOptions = ORDER_STATUS_TRANSITIONS[order.status];
            return (
              <tr key={order.id} className="border-b border-neutral-100">
                <td className="py-2">{order.id.slice(0, 8)}</td>
                <td>${order.totalPrice.toFixed(2)}</td>
                <td>{order.status}</td>
                <td>
                  {nextOptions.length > 0 ? (
                    <select
                      defaultValue=""
                      onChange={(e) =>
                        e.target.value &&
                        updateStatus.mutate({
                          orderId: order.id,
                          status: e.target.value as OrderStatus,
                        })
                      }
                      className="rounded border border-neutral-300 px-2 py-1 text-sm"
                    >
                      <option value="">Change to...</option>
                      {nextOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-neutral-400">Final</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
