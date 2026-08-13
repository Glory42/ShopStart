import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test-router";

const apparelId = "11111111-1111-4111-8111-111111111111";
const outdoorsId = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";

const categories = [
  { id: apparelId, name: "Apparel", slug: "apparel" },
  { id: outdoorsId, name: "Outdoors", slug: "outdoors" },
];

const product = {
  id: productId,
  name: "Everyday Crew Tee",
  description: "A soft cotton tee.",
  price: 24,
  stockQuantity: 10,
  imageUrl: "https://placehold.co/600x600",
  categoryId: apparelId,
};

describe("ProductListPage", () => {
  it("renders every product from the loader", async () => {
    await renderRoute("/products", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: [product] }), { status: 200 }) },
    ]);

    await waitFor(() => expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument());
  });

  it("shows an empty state when there are no matching products", async () => {
    await renderRoute("/products", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: [] }), { status: 200 }) },
    ]);

    await waitFor(() => expect(screen.getByText("No products found.")).toBeInTheDocument());
  });

  it("renders a filter pill for every category, plus 'All'", async () => {
    await renderRoute("/products", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: [] }), { status: 200 }) },
    ]);

    await waitFor(() => expect(screen.getByRole("link", { name: "Apparel" })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Outdoors" })).toBeInTheDocument();
  });

  it("re-fetches products scoped to the selected category when a filter pill is clicked", async () => {
    await renderRoute("/products", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      {
        method: "GET",
        urlIncludes: "/products",
        response: () => new Response(JSON.stringify({ items: [product] }), { status: 200 }),
      },
    ]);

    await waitFor(() => expect(screen.getByRole("link", { name: "Outdoors" })).toBeInTheDocument());
    await userEvent.click(screen.getByRole("link", { name: "Outdoors" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`categoryId=${outdoorsId}`),
        expect.anything(),
      ),
    );
  });
});
