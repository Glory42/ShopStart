import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "./checkout";
import { cartTotal } from "../lib/use-cart";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, useNavigate: () => navigateMock };
});

const CheckoutPage = Route.options.component as React.ComponentType;

const address = {
  id: "address-1",
  line1: "1 Main St",
  line2: null,
  city: "Springfield",
  state: "IL",
  postalCode: "62701",
  country: "US",
};

const cartWithItems = {
  id: "cart-1",
  userId: "user-1",
  items: [
    {
      id: "item-1",
      cartId: "cart-1",
      productId: "product-1",
      quantity: 2,
      product: { id: "product-1", name: "Everyday Crew Tee", price: 24 },
    },
  ],
};

type Route_ = { method: string; urlIncludes: string; response: () => Response };

function mockFetch(routes: Route_[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const match = routes.find((r) => r.method === method && url.includes(r.urlIncludes));
      if (!match) throw new Error(`Unhandled fetch: ${method} ${url}`);
      return Promise.resolve(match.response());
    }),
  );
}

function renderCheckoutPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CheckoutPage />
    </QueryClientProvider>,
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("renders the order total from the shared cartTotal calculation", async () => {
    mockFetch([
      { method: "GET", urlIncludes: "/addresses", response: () => new Response(JSON.stringify([address]), { status: 200 }) },
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify(cartWithItems), { status: 200 }) },
    ]);

    renderCheckoutPage();

    const expectedTotal = cartTotal(cartWithItems as never).toFixed(2);
    await waitFor(() => {
      const totalRow = screen.getByText("Total").closest("div");
      expect(totalRow).toHaveTextContent(`$${expectedTotal}`);
    });
  });

  it("disables Place order until a shipping address is selected", async () => {
    mockFetch([
      { method: "GET", urlIncludes: "/addresses", response: () => new Response(JSON.stringify([]), { status: 200 }) },
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify({ id: "cart-1", userId: "user-1", items: [] }), { status: 200 }) },
    ]);

    renderCheckoutPage();

    await waitFor(() => expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled());
  });

  it("enables Place order once an existing address is selected, and checks out with it", async () => {
    mockFetch([
      { method: "GET", urlIncludes: "/addresses", response: () => new Response(JSON.stringify([address]), { status: 200 }) },
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify(cartWithItems), { status: 200 }) },
      { method: "POST", urlIncludes: "/orders/checkout", response: () => new Response(JSON.stringify({ id: "order-1" }), { status: 201 }) },
    ]);

    renderCheckoutPage();

    const radio = await screen.findByRole("radio");
    await userEvent.click(radio);

    const placeOrderButton = screen.getByRole("button", { name: "Place order" });
    expect(placeOrderButton).toBeEnabled();

    await userEvent.click(placeOrderButton);

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        expect.objectContaining({ to: "/account/orders" }),
      ),
    );

    const checkoutCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(([url, init]) =>
      url.includes("/orders/checkout") && init?.method === "POST",
    );
    expect(JSON.parse(checkoutCall![1].body)).toEqual({ shippingAddressId: "address-1" });
  });

  it("shows the checkout error (e.g. insufficient stock) without navigating away", async () => {
    mockFetch([
      { method: "GET", urlIncludes: "/addresses", response: () => new Response(JSON.stringify([address]), { status: 200 }) },
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify(cartWithItems), { status: 200 }) },
      {
        method: "POST",
        urlIncludes: "/orders/checkout",
        response: () => new Response(JSON.stringify({ message: "Insufficient stock" }), { status: 400 }),
      },
    ]);

    renderCheckoutPage();

    const radio = await screen.findByRole("radio");
    await userEvent.click(radio);
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => expect(screen.getByText("Insufficient stock")).toBeInTheDocument());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("adds a new address, then selects it automatically", async () => {
    const createdAddress = { ...address, id: "address-2", line1: "2 Oak Ave" };
    mockFetch([
      { method: "GET", urlIncludes: "/addresses", response: () => new Response(JSON.stringify([]), { status: 200 }) },
      { method: "GET", urlIncludes: "/cart", response: () => new Response(JSON.stringify({ id: "cart-1", userId: "user-1", items: [] }), { status: 200 }) },
      { method: "POST", urlIncludes: "/addresses", response: () => new Response(JSON.stringify(createdAddress), { status: 201 }) },
    ]);

    renderCheckoutPage();

    await userEvent.click(await screen.findByRole("button", { name: "+ Add a new address" }));

    await userEvent.type(screen.getByPlaceholderText("Address line 1"), "2 Oak Ave");
    await userEvent.type(screen.getByPlaceholderText("City"), "Springfield");
    await userEvent.type(screen.getByPlaceholderText("State"), "IL");
    await userEvent.type(screen.getByPlaceholderText("ZIP code"), "62701");
    await userEvent.clear(screen.getByPlaceholderText("Country (2-letter code)"));
    await userEvent.type(screen.getByPlaceholderText("Country (2-letter code)"), "US");
    await userEvent.click(screen.getByRole("button", { name: "Save address" }));

    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Address line 1")).not.toBeInTheDocument(),
    );
  });
});
