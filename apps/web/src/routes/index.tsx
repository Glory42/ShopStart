import { createFileRoute, Link } from "@tanstack/react-router";
import type { Category, Product } from "@shopstart/types";
import { api } from "../lib/api-client";
import { buttonClasses } from "../components/button";
import { ProductCard } from "../components/product-card";

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
    <div>
      <section className="border-b border-hairline bg-white px-5 pb-20 pt-24 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow mb-5 animate-fade-up">Shopstart</p>
          <h1 className="max-w-3xl animate-fade-up text-6xl font-semibold leading-[1.02] tracking-tightest text-ink sm:text-7xl">
            Everyday things,
            <br />
            made to last.
          </h1>
          <p className="delay-100 mt-6 max-w-lg animate-fade-up text-lg leading-relaxed text-graphite">
            A small, considered collection — apparel, home goods, and gear
            designed to earn a permanent place in your life.
          </p>
          <div className="delay-200 mt-9 flex animate-fade-up items-center gap-4">
            <Link to="/products" className={buttonClasses("dark")}>
              Shop the collection
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-hairline bg-white px-5 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow mb-6">Shop by category</p>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/products"
                search={{ categoryId: category.id }}
                className="rounded-full border border-hairline px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:border-ink"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow mb-3">New arrivals</p>
              <h2 className="text-3xl font-semibold tracking-tight text-ink">
                Featured products
              </h2>
            </div>
            <Link
              to="/products"
              className="hidden text-[14px] font-medium text-accent hover:underline sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
