import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Cart, CartItem } from "@shopstart/types";
import { cartTotal, clampQuantity, useCartMutations } from "./use-cart";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "item-1",
    cartId: "cart-1",
    productId: "product-1",
    quantity: 2,
    product: {
      id: "product-1",
      name: "Everyday Crew Tee",
      price: 24,
      stockQuantity: 10,
      categoryId: "category-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  } as CartItem;
}

describe("cartTotal", () => {
  // The exact fixture both cart.test.tsx and checkout.test.tsx assert
  // against ($48.00 for one item at $24 × quantity 2) — proved once, here,
  // instead of each route test independently re-deriving the formula.
  it("sums price × quantity across items", () => {
    const cart = { id: "cart-1", userId: "user-1", items: [cartItem({ quantity: 2 })] } as Cart;
    expect(cartTotal(cart)).toBe(48);
  });

  it("sums across multiple items", () => {
    const cart = {
      id: "cart-1",
      userId: "user-1",
      items: [
        cartItem({ id: "item-1", quantity: 2, product: { ...cartItem().product!, price: 24 } }),
        cartItem({ id: "item-2", quantity: 1, product: { ...cartItem().product!, price: 10 } }),
      ],
    } as Cart;
    expect(cartTotal(cart)).toBe(58);
  });

  it("treats a line with no product as $0 rather than throwing", () => {
    const cart = {
      id: "cart-1",
      userId: "user-1",
      items: [cartItem({ product: undefined })],
    } as Cart;
    expect(cartTotal(cart)).toBe(0);
  });

  it("returns 0 for an empty cart, and for a missing cart", () => {
    expect(cartTotal({ id: "cart-1", userId: "user-1", items: [] })).toBe(0);
    expect(cartTotal(undefined)).toBe(0);
    expect(cartTotal(null)).toBe(0);
  });
});

describe("clampQuantity", () => {
  it("floors at 1 even when a lower or negative quantity is requested", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-3)).toBe(1);
  });

  it("passes the requested quantity through when stock is unknown", () => {
    expect(clampQuantity(5, undefined)).toBe(5);
  });

  it("clamps to the product's stockQuantity when the request exceeds it", () => {
    expect(clampQuantity(10, 3)).toBe(3);
  });

  it("does not clamp when the request is within stock", () => {
    expect(clampQuantity(2, 5)).toBe(2);
  });

  it("never clamps below 1, even against a 0-stock product", () => {
    expect(clampQuantity(5, 0)).toBe(1);
  });
});

describe("useCartMutations", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("setQuantity clamps the PATCH body to the item's stockQuantity", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    const { result } = renderHook(() => useCartMutations(), { wrapper });
    const item = cartItem({ quantity: 8, product: { ...cartItem().product!, stockQuantity: 10 } });

    result.current.setQuantity(item, 99);

    await waitFor(() => expect(result.current.updateQuantity.isSuccess).toBe(true));

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls.find((args: unknown[]) =>
      (args[0] as string).includes("/cart/items/product-1"),
    );
    expect(call).toBeDefined();
    expect(JSON.parse((call![1] as RequestInit).body as string)).toEqual({ quantity: 10 });
  });

  it("addItem posts to /cart/items with the requested product and quantity", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 201 }),
    );

    const { result } = renderHook(() => useCartMutations(), { wrapper });

    result.current.addItem.mutate({ productId: "product-1" });

    await waitFor(() => expect(result.current.addItem.isSuccess).toBe(true));

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls.find((args: unknown[]) =>
      (args[0] as string).includes("/cart/items"),
    );
    expect(JSON.parse((call![1] as RequestInit).body as string)).toEqual({
      productId: "product-1",
      quantity: 1,
    });
  });
});
