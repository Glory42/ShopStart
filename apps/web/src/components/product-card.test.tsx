import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Product } from "@shopstart/types";
import { ProductCard } from "./product-card";

// ProductCard's own logic (price/stock display) is what's under test here,
// not @tanstack/react-router's Link — stub it to a plain anchor so the
// component renders without a full router context.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    to,
    params,
  }: {
    children: ReactNode;
    className?: string;
    to: string;
    params?: { productId?: string };
  }) => (
    <a href={to.replace("$productId", params?.productId ?? "")} className={className}>
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

describe("ProductCard", () => {
  it("shows the product name and price when in stock", () => {
    render(<ProductCard product={makeProduct({ price: 24 })} />);

    expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument();
    expect(screen.getByText("From $24.00")).toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
  });

  it("shows 'Unavailable' and the out-of-stock badge instead of a price when stock is 0", () => {
    render(<ProductCard product={makeProduct({ stockQuantity: 0 })} />);

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.queryByText(/^From \$/)).not.toBeInTheDocument();
  });

  it("links to the product's own detail page", () => {
    render(<ProductCard product={makeProduct({ id: "abc-123" })} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/abc-123");
  });

  it("uses the product name as the image's alt text", () => {
    render(<ProductCard product={makeProduct({ name: "Merino Wool Beanie" })} />);

    expect(screen.getByAltText("Merino Wool Beanie")).toBeInTheDocument();
  });
});
