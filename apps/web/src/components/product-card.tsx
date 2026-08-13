import { Link } from "@tanstack/react-router";
import type { Product } from "@shopstart/types";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stockQuantity === 0;

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper-2">
        <img
          src={product.imageUrl ?? undefined}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-canvas/85 px-3 py-1 text-[11px] font-medium text-graphite backdrop-blur">
            Out of stock
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <p className="text-[15px] font-medium text-ink">{product.name}</p>
      </div>
      <p className="mt-0.5 text-[15px] text-graphite">
        {outOfStock ? "Unavailable" : `From $${product.price.toFixed(2)}`}
      </p>
    </Link>
  );
}
