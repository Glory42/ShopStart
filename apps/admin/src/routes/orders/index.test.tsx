import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "./index";
import { mockFetch, authMeHandler } from "../../test-fetch";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, className, to }: { children: React.ReactNode; className?: string; to: string }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

const OrdersPage = Route.options.component as React.ComponentType;

const orderId = "aaaaaaaa-1111-4111-8111-111111111111";

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: orderId,
    userId: "user-1",
    status: "PENDING",
    items: [
      {
        id: "item-1",
        orderId,
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

function renderOrdersPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OrdersPage />
    </QueryClientProvider>,
  );
}

describe("Admin OrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders each order's id prefix, total, and status", async () => {
    mockFetch([
      authMeHandler(),
      {
        method: "GET",
        urlIncludes: "/orders/admin",
        response: () => new Response(JSON.stringify([makeOrder()]), { status: 200 }),
      },
    ]);

    renderOrdersPage();

    await waitFor(() => expect(screen.getByText(orderId.slice(0, 8))).toBeInTheDocument());
    expect(screen.getByText("$48.00")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("offers only the valid next statuses for a PENDING order", async () => {
    mockFetch([
      authMeHandler(),
      {
        method: "GET",
        urlIncludes: "/orders/admin",
        response: () => new Response(JSON.stringify([makeOrder({ status: "PENDING" })]), { status: 200 }),
      },
    ]);

    renderOrdersPage();

    const select = await screen.findByRole("combobox");
    expect(within(select).getByRole("option", { name: "Change to..." })).toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "PAID" })).toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "CANCELLED" })).toBeInTheDocument();
    expect(within(select).queryByRole("option", { name: "SHIPPED" })).not.toBeInTheDocument();
  });

  it("sends the selected status to PATCH /orders/:id/status and reflects the new status once refetched", async () => {
    let currentOrders = [makeOrder({ status: "PENDING" })];
    mockFetch([
      authMeHandler(),
      {
        method: "GET",
        urlIncludes: "/orders/admin",
        response: () => new Response(JSON.stringify(currentOrders), { status: 200 }),
      },
      {
        method: "PATCH",
        urlIncludes: `/orders/${orderId}/status`,
        response: () => {
          currentOrders = currentOrders.map((order) => ({ ...order, status: "PAID" }));
          return new Response(JSON.stringify({}), { status: 200 });
        },
      },
    ]);

    renderOrdersPage();

    const select = await screen.findByRole("combobox");
    await userEvent.selectOptions(select, "PAID");

    const patchCall = await waitFor(() => {
      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (args: unknown[]) => (args[0] as string).includes(`/orders/${orderId}/status`) && (args[1] as RequestInit)?.method === "PATCH",
      );
      if (!call) throw new Error("not called yet");
      return call as [string, RequestInit];
    });
    expect(JSON.parse(patchCall[1].body as string)).toEqual({ status: "PAID" });

    await waitFor(() => expect(screen.getByText("PAID")).toBeInTheDocument());
    expect(screen.queryByText("PENDING")).not.toBeInTheDocument();

    const refreshedOptions = within(screen.getByRole("combobox")).getAllByRole("option").map((o) => o.textContent);
    expect(refreshedOptions).toEqual(["Change to...", "SHIPPED", "CANCELLED", "REFUNDED"]);
  });

  it("shows 'Final' with no dropdown for an order in a terminal status", async () => {
    mockFetch([
      authMeHandler(),
      {
        method: "GET",
        urlIncludes: "/orders/admin",
        response: () => new Response(JSON.stringify([makeOrder({ status: "REFUNDED" })]), { status: 200 }),
      },
    ]);

    renderOrdersPage();

    await waitFor(() => expect(screen.getByText("Final")).toBeInTheDocument());
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
