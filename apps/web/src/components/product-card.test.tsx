import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Product } from "@shopstart/types";
import { ProductCard } from "./product-card";

// ProductCard's own logic (price/stock display) is what's under test here,
// not @tanstack/react-router's Link — stub it to a plain anchor so the
// component renders without a full router context. WishlistButton (a child
// of ProductCard) needs a real QueryClientProvider for useSession/useQuery.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    to,
    params,
    ...rest
  }: {
    children: ReactNode;
    className?: string;
    to: string;
    params?: { productId?: string };
    [key: string]: unknown;
  }) => (
    <a href={to.replace("$productId", params?.productId ?? "")} className={className} {...rest}>
      {children}
    </a>
  ),
}));

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    name: "Everyday Crew Tee",
    description: "A soft cotton tee.",
    price: 24,
    stockQuantity: 10,
    imageUrl: "https://placehold.co/600x600",
    categoryId: "category-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function renderCard(product: Product) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductCard product={product} />
    </QueryClientProvider>,
  );
}

describe("ProductCard", () => {
  beforeEach(() => {
    // WishlistButton renders its useSession() query on mount; default to
    // signed-out (401) so tests unrelated to wishlists aren't affected.
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
        ),
      ),
    );
  });

  it("shows the product name and price when in stock", () => {
    renderCard(makeProduct({ price: 24 }));

    expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument();
    expect(screen.getByText("From $24.00")).toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
  });

  it("shows 'Unavailable' and the out-of-stock badge instead of a price when stock is 0", () => {
    renderCard(makeProduct({ stockQuantity: 0 }));

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.queryByText(/^From \$/)).not.toBeInTheDocument();
  });

  it("links to the product's own detail page", () => {
    renderCard(makeProduct({ id: "abc-123" }));

    const productLink = screen
      .getAllByRole("link")
      .find((el) => el.getAttribute("href") === "/products/abc-123");
    expect(productLink).toBeDefined();
  });

  it("uses the product name as the image's alt text", () => {
    renderCard(makeProduct({ name: "Merino Wool Beanie" }));

    expect(screen.getByAltText("Merino Wool Beanie")).toBeInTheDocument();
  });

  it("shows a signed-out save prompt that links to login, rendered outside the product link", () => {
    renderCard(makeProduct({ id: "abc-123" }));

    const saveLink = screen.getByRole("link", { name: "Log in to save to a wishlist" });
    expect(saveLink).toHaveAttribute("href", "/login");
  });
});
