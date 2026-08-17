import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "../lib/use-cart";
import { Button, buttonClasses } from "../components/button";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { cart, isLoading, total, setQuantity, removeItem } = useCart();

  if (isLoading) {
    return <div className="px-5 py-24 text-center text-[15px] text-graphite">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="px-5 py-28 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Your bag is empty
        </h1>
        <p className="mt-3 text-[15px] text-graphite">
          Everything you add will show up here.
        </p>
        <Link to="/products" className={`${buttonClasses("invert")} mt-7 inline-flex`}>
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="mb-10 text-4xl font-semibold tracking-tight text-ink">
        Review your bag
      </h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-hairline border-y border-hairline">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-center gap-5 py-6">
              <Link
                to="/products/$productId"
                params={{ productId: item.productId }}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-paper-2"
              >
                <img
                  src={item.product?.imageUrl ?? undefined}
                  alt={item.product?.name}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to="/products/$productId"
                  params={{ productId: item.productId }}
                  className="text-[15px] font-medium text-ink hover:text-graphite"
                >
                  {item.product?.name}
                </Link>
                <p className="mt-1 text-[14px] text-graphite">
                  ${item.product?.price.toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem.mutate(item.productId)}
                  className="mt-2 text-[13px] text-accent hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center rounded-full border border-hairline">
                <button
                  onClick={() => setQuantity(item, item.quantity - 1)}
                  className="h-9 w-9 text-[15px] text-ink hover:text-graphite"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-6 text-center text-[14px] text-ink">
                  {item.quantity}
                </span>
                <button
                  onClick={() => setQuantity(item, item.quantity + 1)}
                  disabled={
                    item.product?.stockQuantity !== undefined &&
                    item.quantity >= item.product.stockQuantity
                  }
                  className="h-9 w-9 text-[15px] text-ink hover:text-graphite disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-2xl border border-hairline p-6 lg:sticky lg:top-20">
          <p className="eyebrow mb-4">Order summary</p>
          <div className="flex items-center justify-between text-[14px] text-graphite">
            <span>Subtotal</span>
            <span className="text-ink">${total.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[14px] text-graphite">
            <span>Shipping</span>
            <span className="text-ink">Calculated at checkout</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4 text-[15px] font-medium text-ink">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Link to="/checkout" className="mt-6 block">
            <Button variant="primary" className="w-full">
              Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
