import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import type { Product } from "@shopstart/types";
import { api } from "../../lib/api-client";

const searchSchema = z.object({
  categoryId: z.string().uuid().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/products/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const params = new URLSearchParams();
    if (deps.categoryId) params.set("categoryId", deps.categoryId);
    if (deps.q) params.set("q", deps.q);
    const result = await api.get<{ items: Product[] }>(`/products?${params}`);
    return result.items;
  },
  component: ProductListPage,
});

function ProductListPage() {
  const products = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">All products</h1>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            to="/products/$productId"
            params={{ productId: product.id }}
            className="block"
          >
            <img
              src={product.imageUrl ?? undefined}
              alt={product.name}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <p className="mt-2 text-sm font-medium">{product.name}</p>
            <p className="text-sm text-neutral-600">
              {product.stockQuantity > 0 ? `$${product.price.toFixed(2)}` : "Out of stock"}
            </p>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-neutral-500">No products found.</p>
        )}
      </div>
    </div>
  );
}
