import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderRoute } from "../test-router";

const apparelId = "11111111-1111-4111-8111-111111111111";
const outdoorsId = "22222222-2222-4222-8222-222222222222";
const emptyId = "33333333-3333-4333-8333-333333333333";

const categories = [
  { id: apparelId, name: "Apparel", slug: "apparel" },
  { id: outdoorsId, name: "Outdoors", slug: "outdoors" },
  { id: emptyId, name: "Empty Category", slug: "empty-category" },
];

function makeProduct(id: string, categoryId: string, name: string) {
  return {
    id,
    name,
    description: "A well-made thing.",
    price: 24,
    stockQuantity: 10,
    imageUrl: "https://placehold.co/600x600",
    categoryId,
  };
}

const products = [
  makeProduct("44444444-4444-4444-8444-444444444444", apparelId, "Everyday Crew Tee"),
  makeProduct("55555555-5555-4555-8555-555555555555", outdoorsId, "Trail Backpack"),
];

describe("HomePage", () => {
  it("shows the piece and category counts from the loader", async () => {
    await renderRoute("/", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: products, total: products.length }), { status: 200 }) },
    ]);

    await waitFor(() =>
      expect(screen.getByText("2 pieces · 3 categories")).toBeInTheDocument(),
    );
  });

  it("groups products by category and renders each product once", async () => {
    await renderRoute("/", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: products, total: products.length }), { status: 200 }) },
    ]);

    await waitFor(() => expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Apparel" })).toBeInTheDocument();
    expect(screen.getByText("Trail Backpack")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Outdoors" })).toBeInTheDocument();
  });

  it("omits category sections that have no products", async () => {
    await renderRoute("/", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: products, total: products.length }), { status: 200 }) },
    ]);

    await waitFor(() => expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument());
    expect(screen.queryByRole("heading", { name: "Empty Category" })).not.toBeInTheDocument();
  });

  it("links each category's 'View all' to the products list scoped to that category", async () => {
    await renderRoute("/", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: products, total: products.length }), { status: 200 }) },
    ]);

    await waitFor(() => expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument());
    const viewAllLinks = screen.getAllByRole("link", { name: "View all →" });
    expect(viewAllLinks[0]).toHaveAttribute("href", expect.stringContaining(apparelId));
  });

  it("uses singular units when there is exactly one piece and one category", async () => {
    await renderRoute("/", [
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify([categories[0]]), { status: 200 }) },
      {
        method: "GET",
        urlIncludes: "/products",
        response: () =>
          new Response(JSON.stringify({ items: [products[0]], total: 1 }), { status: 200 }),
      },
    ]);

    await waitFor(() => expect(screen.getByText("1 piece · 1 category")).toBeInTheDocument());
  });
});
