import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderRoute } from "../../test-router";

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "aaaaaaaa-1111-4111-8111-111111111111",
    userId: "user-1",
    status: "PENDING",
    items: [
      {
        id: "item-1",
        orderId: "aaaaaaaa-1111-4111-8111-111111111111",
        productId: "product-1",
        productName: "Everyday Crew Tee",
        unitPrice: 24,
        quantity: 2,
      },
    ],
    shippingLine1: "1 Main St",
    shippingLine2: null,
    shippingCity: "Springfield",
    shippingState: "IL",
    shippingPostalCode: "62704",
    shippingCountry: "US",
    totalPrice: 48,
    payment: null,
    createdAt: "2026-01-15T00:00:00.000Z",
    ...overrides,
  };
}

function renderOrders(orders: unknown[]) {
  return renderRoute("/account/orders", [
    { method: "GET", urlIncludes: "/orders", response: () => new Response(JSON.stringify(orders), { status: 200 }) },
  ]);
}

describe("OrdersPage", () => {
  it("shows an empty state with a link to start shopping when there are no orders", async () => {
    await renderOrders([]);

    await waitFor(() => expect(screen.getByText("No orders yet")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Start shopping" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("renders each order's items and total", async () => {
    await renderOrders([makeOrder()]);

    await waitFor(() => expect(screen.getByText("Your orders")).toBeInTheDocument());
    expect(screen.getByText("Everyday Crew Tee × 2")).toBeInTheDocument();
    expect(screen.getAllByText("$48.00")).toHaveLength(2); // item line total + order total
    expect(screen.getByText("#aaaaaaaa")).toBeInTheDocument();
  });

  it.each([
    ["PENDING", "bg-warning/15", "text-warning"],
    ["PAID", "bg-accent/15", "text-accent"],
    ["SHIPPED", "bg-accent/15", "text-accent"],
    ["DELIVERED", "bg-success/15", "text-success"],
    ["CANCELLED", "bg-paper-2", "text-graphite"],
    ["REFUNDED", "bg-paper-2", "text-graphite"],
  ])("applies the STATUS_STYLES badge classes for %s orders", async (status, bgClass, textClass) => {
    await renderOrders([makeOrder({ status })]);

    const badge = await screen.findByText(status);
    expect(badge).toHaveClass(bgClass, textClass);
  });
});
