import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@shopstart/types";
import { ORDER_STATUS_TRANSITIONS, OrderStatus } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { useRequireAdmin } from "../../lib/session";
import { Table, TableBody, TableHead, TableRow } from "../../components/table";

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
      <Table>
        <TableHead columns={["Order", "Total", "Status", "Update"]} />
        <TableBody>
          {orders?.map((order) => {
            const nextOptions = ORDER_STATUS_TRANSITIONS[order.status];
            return (
              <TableRow
                key={order.id}
                cells={[
                  order.id.slice(0, 8),
                  `$${order.totalPrice.toFixed(2)}`,
                  order.status,
                  nextOptions.length > 0 ? (
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
                  ),
                ]}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
