import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Product, Review } from "@shopstart/types";
import { api } from "../../lib/api-client";

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params }) => {
    const [product, reviews] = await Promise.all([
      api.get<Product>(`/products/${params.productId}`),
      api.get<(Review & { user: { username: string } })[]>(
        `/products/${params.productId}/reviews`,
      ),
    ]);
    return { product, reviews };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product, reviews } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);

  const addToCart = useMutation({
    mutationFn: () => api.post("/cart/items", { productId: product.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setAdded(true);
    },
  });

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <img
        src={product.imageUrl ?? undefined}
        alt={product.name}
        className="aspect-square w-full rounded-lg object-cover"
      />
      <div>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="mt-2 text-xl">${product.price.toFixed(2)}</p>
        <p className="mt-4 text-neutral-600">{product.description}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {product.stockQuantity > 0
            ? `${product.stockQuantity} in stock`
            : "Out of stock"}
        </p>

        <button
          onClick={() => addToCart.mutate()}
          disabled={product.stockQuantity === 0 || addToCart.isPending}
          className="mt-6 rounded-md bg-neutral-900 px-6 py-2 text-white disabled:opacity-50"
        >
          {added ? "Added" : "Add to cart"}
        </button>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-medium">Reviews</h2>
          {reviews.length === 0 && (
            <p className="text-sm text-neutral-500">No reviews yet.</p>
          )}
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-neutral-200 pb-3">
                <p className="text-sm font-medium">
                  {review.user.username} — {review.rating}/5
                </p>
                {review.comment && (
                  <p className="text-sm text-neutral-600">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
