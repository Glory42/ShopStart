import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test-router";
import { cartTotal } from "../lib/use-cart";

const productId = "33333333-3333-4333-8333-333333333333";

function cartWith(items: unknown[]) {
  return { id: "cart-1", userId: "user-1", items };
}

const oneItem = (quantity: number) => [
  {
    id: "item-1",
    cartId: "cart-1",
    productId,
    quantity,
    product: { id: productId, name: "Everyday Crew Tee", price: 24, imageUrl: "https://placehold.co/600x600" },
  },
];

describe("CartPage", () => {
  it("shows an empty-bag message when the cart has no items", async () => {
    await renderRoute("/cart", [
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify(cartWith([])), { status: 200 }) },
    ]);

    await waitFor(() => expect(screen.getByText("Your bag is empty")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Continue shopping" })).toBeInTheDocument();
  });

  it("renders the subtotal and total from the shared cartTotal calculation", async () => {
    const cart = cartWith(oneItem(2));
    const expectedTotal = cartTotal(cart as never).toFixed(2);

    await renderRoute("/cart", [
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify(cart), { status: 200 }) },
    ]);

    await waitFor(() => {
      const subtotalRow = screen.getByText("Subtotal").closest("div");
      expect(subtotalRow).toHaveTextContent(`$${expectedTotal}`);
      const totalRow = screen.getByText("Total").closest("div");
      expect(totalRow).toHaveTextContent(`$${expectedTotal}`);
    });
  });

  it("increases quantity by 1 when + is clicked", async () => {
    await renderRoute("/cart", [
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify(cartWith(oneItem(2))), { status: 200 }) },
      { method: "PATCH", urlIncludes: `/cart/items/${productId}`, response: () => new Response(JSON.stringify({}), { status: 200 }) },
    ]);

    await userEvent.click(await screen.findByRole("button", { name: "Increase quantity" }));

    const patchCall = await waitFor(() => {
      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (args: unknown[]) =>
          (args[0] as string).includes(`/cart/items/${productId}`) &&
          (args[1] as RequestInit).method === "PATCH",
      );
      if (!call) throw new Error("not called yet");
      return call as [string, RequestInit];
    });
    expect(JSON.parse(patchCall[1].body as string)).toEqual({ quantity: 3 });
  });

  it("never decreases quantity below 1", async () => {
    await renderRoute("/cart", [
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify(cartWith(oneItem(1))), { status: 200 }) },
      { method: "PATCH", urlIncludes: `/cart/items/${productId}`, response: () => new Response(JSON.stringify({}), { status: 200 }) },
    ]);

    await userEvent.click(await screen.findByRole("button", { name: "Decrease quantity" }));

    const patchCall = await waitFor(() => {
      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (args: unknown[]) =>
          (args[0] as string).includes(`/cart/items/${productId}`) &&
          (args[1] as RequestInit).method === "PATCH",
      );
      if (!call) throw new Error("not called yet");
      return call as [string, RequestInit];
    });
    expect(JSON.parse(patchCall[1].body as string)).toEqual({ quantity: 1 });
  });

  it("disables Increase quantity once the item is at its product's stockQuantity", async () => {
    await renderRoute("/cart", [
      {
        method: "GET",
        urlIncludes: "/cart",
        response: () =>
          new Response(
            JSON.stringify(
              cartWith([
                {
                  id: "item-1",
                  cartId: "cart-1",
                  productId,
                  quantity: 3,
                  product: {
                    id: productId,
                    name: "Everyday Crew Tee",
                    price: 24,
                    stockQuantity: 3,
                    imageUrl: "https://placehold.co/600x600",
                  },
                },
              ]),
            ),
            { status: 200 },
          ),
      },
    ]);

    const increaseButton = await screen.findByRole("button", { name: "Increase quantity" });
    expect(increaseButton).toBeDisabled();
  });

  it("removes an item from the cart", async () => {
    await renderRoute("/cart", [
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify(cartWith(oneItem(1))), { status: 200 }) },
      { method: "DELETE", urlIncludes: `/cart/items/${productId}`, response: () => new Response(JSON.stringify({}), { status: 200 }) },
    ]);

    await userEvent.click(await screen.findByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(
        (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
          (args: unknown[]) =>
            (args[0] as string).includes(`/cart/items/${productId}`) &&
            (args[1] as RequestInit).method === "DELETE",
        ),
      ).toBe(true),
    );
  });
});
