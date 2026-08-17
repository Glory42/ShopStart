import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Product, Review } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { Button } from "../../components/button";
import { WishlistButton } from "../../components/wishlist-button";

type ReviewWithUser = Review & { user: { username: string } };

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params }) => {
    const [product, reviews] = await Promise.all([
      api.get<Product>(`/products/${params.productId}`),
      api.get<ReviewWithUser[]>(`/products/${params.productId}/reviews`),
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
      setTimeout(() => setAdded(false), 2000);
    },
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div>
      <div className="border-b border-hairline bg-canvas px-5 py-3">
        <div className="mx-auto max-w-6xl text-[13px] text-graphite">
          <Link to="/products" className="hover:text-ink">
            All products
          </Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link
                to="/products"
                search={{ categoryId: product.category.id }}
                className="hover:text-ink"
              >
                {product.category.name}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-3xl bg-paper-2">
            <img
              src={product.imageUrl ?? undefined}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            {product.category && <p className="eyebrow mb-4">{product.category.name}</p>}
            <h1 className="text-4xl font-semibold tracking-tight text-ink">
              {product.name}
            </h1>
            {averageRating !== null && (
              <div className="mt-3 flex items-center gap-2 text-[14px] text-graphite">
                <span className="text-ink">{"★".repeat(Math.round(averageRating))}</span>
                <span className="text-hairline">{"★".repeat(5 - Math.round(averageRating))}</span>
                <span>
                  {averageRating.toFixed(1)} · {reviews.length}{" "}
                  {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}
            <p className="mt-6 text-2xl font-medium text-ink">
              ${product.price.toFixed(2)}
            </p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-graphite">
              {product.description}
            </p>

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => addToCart.mutate()}
                  disabled={product.stockQuantity === 0 || addToCart.isPending}
                >
                  {product.stockQuantity === 0
                    ? "Out of stock"
                    : added
                      ? "Added to bag"
                      : "Add to bag"}
                </Button>
                <WishlistButton productId={product.id} variant="button" />
              </div>
              <p className="mt-3 text-[13px] text-graphite">
                {product.stockQuantity > 0
                  ? `${product.stockQuantity} in stock — ships in 2-3 business days`
                  : "Currently unavailable"}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-24 border-t border-hairline pt-14">
          <p className="eyebrow mb-3">Customer reviews</p>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-ink">
            What people are saying
          </h2>

          {reviews.length === 0 ? (
            <p className="text-[15px] text-graphite">
              No reviews yet — be the first to leave one after your order is delivered.
            </p>
          ) : (
            <ul className="grid gap-8 sm:grid-cols-2">
              {reviews.map((review) => (
                <li key={review.id} className="border-t border-hairline pt-5">
                  <p className="text-ink">
                    {"★".repeat(review.rating)}
                    <span className="text-hairline">{"★".repeat(5 - review.rating)}</span>
                  </p>
                  <p className="mt-2 text-[13px] font-medium text-ink">
                    {review.user.username}
                  </p>
                  {review.comment && (
                    <p className="mt-1 text-[14px] leading-relaxed text-graphite">
                      {review.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
