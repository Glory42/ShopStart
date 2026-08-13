import { createFileRoute, Link } from "@tanstack/react-router";
import type { Category, Product } from "@shopstart/types";
import { api } from "../lib/api-client";
import { ProductCard } from "../components/product-card";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [categories, result] = await Promise.all([
      api.get<Category[]>("/categories"),
      api.get<{ items: Product[]; total: number }>("/products?pageSize=100"),
    ]);
    return { categories, products: result.items, total: result.total };
  },
  component: HomePage,
});

/**
 * Catalogue macrostructure (design.md § Per-page treatment): brand mark +
 * tagline only, no big display heading, no global CTA — the grid of
 * products is the page. Category label bands divide the index into rows,
 * mirroring a foundry specimen page grouped by weight instead of one long
 * "featured" shelf.
 */
function HomePage() {
  const { categories, products, total } = Route.useLoaderData();

  const byCategory = categories
    .map((category) => ({
      category,
      products: products.filter((p) => p.categoryId === category.id),
    }))
    .filter((group) => group.products.length > 0);

  return (
    <div>
      <section className="border-b border-hairline bg-white px-5 pb-10 pt-16 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow mb-4 animate-fade-up">Shopstart</p>
          <h1 className="max-w-lg animate-fade-up text-3xl font-semibold leading-snug tracking-tight text-ink sm:text-4xl">
            Everyday things, made to last.
          </h1>
          <p className="delay-100 mt-3 animate-fade-up font-mono text-[13px] text-graphite">
            {total} {total === 1 ? "piece" : "pieces"} · {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
      </section>

      {byCategory.map(({ category, products: categoryProducts }) => (
        <section key={category.id} className="border-b border-hairline bg-white px-5 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-baseline justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                {category.name}
              </h2>
              <Link
                to="/products"
                search={{ categoryId: category.id }}
                className="text-[13px] font-medium text-accent hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
              {categoryProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
