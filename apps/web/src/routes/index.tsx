import { createFileRoute, Link } from "@tanstack/react-router";
import type { Category, Product } from "@shopstart/types";
import { api } from "../lib/api-client";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [categories, products] = await Promise.all([
      api.get<Category[]>("/categories"),
      api.get<{ items: Product[] }>("/products?pageSize=8"),
    ]);
    return { categories, products: products.items };
  },
  component: HomePage,
});

function HomePage() {
  const { categories, products } = Route.useLoaderData();

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-semibold">shopstart</h1>
        <p className="mt-2 text-neutral-600">
          A clone-and-build e-commerce template. This storefront is server-rendered
          with TanStack Start against the shopstart NestJS API.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Shop by category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/products"
              search={{ categoryId: category.id }}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:border-neutral-500"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Featured products</h2>
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
              <p className="text-sm text-neutral-600">${product.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
