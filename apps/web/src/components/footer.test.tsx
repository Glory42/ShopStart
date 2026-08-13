import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className, to }: never) => (
    <a href={`${to}`} className={className}>
      {children}
    </a>
  ),
}));

describe("Footer", () => {
  it("renders every utility link with its real destination", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "Your cart" })).toHaveAttribute("href", "/cart");
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/account/orders",
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("shows the current year in the copyright line", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} shopstart`))).toBeInTheDocument();
  });
});
