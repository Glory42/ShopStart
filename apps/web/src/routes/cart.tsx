import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@shopstart/types";
import { api } from "../lib/api-client";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const queryClient = useQueryClient();
  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get<Cart>("/cart"),
  });

  const updateQuantity = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.patch(`/cart/items/${productId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => api.delete(`/cart/items/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) return <p>Loading cart...</p>;
  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link to="/products" className="mt-4 inline-block text-neutral-600 underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  const total = cart.items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Your cart</h1>
      <ul className="divide-y divide-neutral-200">
        {cart.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <img
              src={item.product?.imageUrl ?? undefined}
              alt={item.product?.name}
              className="h-20 w-20 rounded-md object-cover"
            />
            <div className="flex-1">
              <p className="font-medium">{item.product?.name}</p>
              <p className="text-sm text-neutral-600">
                ${item.product?.price.toFixed(2)}
              </p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) =>
                updateQuantity.mutate({
                  productId: item.productId,
                  quantity: Number(e.target.value) || 1,
                })
              }
              className="w-16 rounded border border-neutral-300 px-2 py-1"
            />
            <button
              onClick={() => removeItem.mutate(item.productId)}
              className="text-sm text-neutral-500"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-medium">Total: ${total.toFixed(2)}</p>
        <Link
          to="/checkout"
          className="rounded-md bg-neutral-900 px-6 py-2 text-white"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
