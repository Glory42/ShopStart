import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test-router";

const productId = "33333333-3333-4333-8333-333333333333";

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: productId,
    name: "Everyday Crew Tee",
    description: "A soft cotton tee.",
    price: 24,
    stockQuantity: 10,
    imageUrl: "https://placehold.co/600x600",
    categoryId: "11111111-1111-4111-8111-111111111111",
    ...overrides,
  };
}

function mockProductDetail(product: unknown, reviews: unknown[] = []) {
  return [
    {
      method: "GET",
      urlIncludes: `/products/${productId}/reviews`,
      response: () => new Response(JSON.stringify(reviews), { status: 200 }),
    },
    {
      method: "GET",
      urlIncludes: `/products/${productId}`,
      response: () => new Response(JSON.stringify(product), { status: 200 }),
    },
  ];
}

describe("ProductDetailPage", () => {
  it("renders the product's name, price, and description", async () => {
    await renderRoute(`/products/${productId}`, mockProductDetail(makeProduct()));

    await waitFor(() => expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument());
    expect(screen.getByText("A soft cotton tee.")).toBeInTheDocument();
    expect(screen.getByText("$24.00")).toBeInTheDocument();
  });

  it("disables Add to bag and shows 'Out of stock' when stockQuantity is 0", async () => {
    await renderRoute(
      `/products/${productId}`,
      mockProductDetail(makeProduct({ stockQuantity: 0 })),
    );

    const button = await screen.findByRole("button", { name: "Out of stock" });
    expect(button).toBeDisabled();
    expect(screen.getByText("Currently unavailable")).toBeInTheDocument();
  });

  it("shows remaining stock count when in stock", async () => {
    await renderRoute(
      `/products/${productId}`,
      mockProductDetail(makeProduct({ stockQuantity: 7 })),
    );

    await waitFor(() =>
      expect(screen.getByText("7 in stock — ships in 2-3 business days")).toBeInTheDocument(),
    );
  });

  it("shows the empty-reviews message when there are no reviews", async () => {
    await renderRoute(`/products/${productId}`, mockProductDetail(makeProduct(), []));

    await waitFor(() =>
      expect(
        screen.getByText("No reviews yet — be the first to leave one after your order is delivered."),
      ).toBeInTheDocument(),
    );
  });

  it("computes the average rating from reviews and shows the review count", async () => {
    await renderRoute(
      `/products/${productId}`,
      mockProductDetail(makeProduct(), [
        { id: "r1", rating: 5, comment: "Great", user: { username: "alice" } },
        { id: "r2", rating: 3, comment: "Fine", user: { username: "bob" } },
      ]),
    );

    await waitFor(() => expect(screen.getByText("4.0 · 2 reviews")).toBeInTheDocument());
  });

  it("adds the product to the cart and briefly shows confirmation", async () => {
    const routes = mockProductDetail(makeProduct());
    routes.push({
      method: "POST",
      urlIncludes: "/cart/items",
      response: () => new Response(JSON.stringify({}), { status: 201 }),
    });

    await renderRoute(`/products/${productId}`, routes);

    const addButton = await screen.findByRole("button", { name: "Add to bag" });
    await userEvent.click(addButton);

    await waitFor(() => expect(screen.getByRole("button", { name: "Added to bag" })).toBeInTheDocument());

    const cartCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (args: unknown[]) =>
        (args[0] as string).includes("/cart/items") && (args[1] as RequestInit).method === "POST",
    ) as [string, RequestInit] | undefined;
    expect(JSON.parse(cartCall![1].body as string)).toEqual({ productId, quantity: 1 });
  });
});
