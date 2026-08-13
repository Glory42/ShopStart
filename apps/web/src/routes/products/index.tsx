import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import type { Category, Product } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { ProductCard } from "../../components/product-card";
import { cn } from "../../lib/cn";

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
    const [result, categories] = await Promise.all([
      api.get<{ items: Product[] }>(`/products?${params}`),
      api.get<Category[]>("/categories"),
    ]);
    return { products: result.items, categories };
  },
  component: ProductListPage,
});

function ProductListPage() {
  const { products, categories } = Route.useLoaderData();
  const { categoryId } = Route.useSearch();

  return (
    <div>
      <div className="border-b border-hairline bg-canvas px-5 pb-8 pt-14">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow mb-3">Catalog</p>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            All products
          </h1>
        </div>
      </div>

      <div className="border-b border-hairline bg-canvas px-5 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          <Link
            to="/products"
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
              !categoryId
                ? "bg-ink text-canvas"
                : "border border-hairline text-ink hover:border-ink",
            )}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/products"
              search={{ categoryId: category.id }}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                categoryId === category.id
                  ? "bg-ink text-canvas"
                  : "border border-hairline text-ink hover:border-ink",
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-canvas px-5 py-14">
        <div className="mx-auto max-w-6xl">
          {products.length === 0 ? (
            <p className="py-20 text-center text-[15px] text-graphite">
              No products found.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
