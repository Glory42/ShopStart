import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Nav } from "./nav";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className, to }: never) => (
    <a href={`${to}`} className={className}>
      {children}
    </a>
  ),
  useRouter: () => ({ navigate: navigateMock }),
}));

function renderNav() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Nav />
    </QueryClientProvider>,
  );
}

function mockFetchByUrl(handlers: Record<string, () => Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      for (const [pattern, handler] of Object.entries(handlers)) {
        if (url.includes(pattern)) return Promise.resolve(handler());
      }
      throw new Error(`Unhandled fetch: ${url}`);
    }),
  );
}

describe("Nav", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("shows Log in and no Orders link when signed out", async () => {
    mockFetchByUrl({
      "/auth/me": () => new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    });

    renderNav();

    await waitFor(() => expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Orders" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  it("shows Log out and the Orders link when signed in", async () => {
    mockFetchByUrl({
      "/auth/me": () => new Response(JSON.stringify({ id: "user-1", email: "a@b.com" }), { status: 200 }),
      "/cart": () => new Response(JSON.stringify({ id: "cart-1", userId: "user-1", items: [] }), { status: 200 }),
    });

    renderNav();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument();
  });

  it("shows the cart item count when the cart has items", async () => {
    mockFetchByUrl({
      "/auth/me": () => new Response(JSON.stringify({ id: "user-1", email: "a@b.com" }), { status: 200 }),
      "/cart": () =>
        new Response(
          JSON.stringify({
            id: "cart-1",
            userId: "user-1",
            items: [
              { id: "i1", cartId: "cart-1", productId: "p1", quantity: 2 },
              { id: "i2", cartId: "cart-1", productId: "p2", quantity: 1 },
            ],
          }),
          { status: 200 },
        ),
    });

    renderNav();

    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());
  });

  it("does not show a cart badge for a signed-out (unfetched) cart", async () => {
    mockFetchByUrl({
      "/auth/me": () => new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    });

    renderNav();

    await waitFor(() => expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Cart/ }).textContent).toBe("Cart");
  });

  it("logs out, clears the session, and navigates home", async () => {
    mockFetchByUrl({
      "/auth/me": () => new Response(JSON.stringify({ id: "user-1", email: "a@b.com" }), { status: 200 }),
      "/cart": () => new Response(JSON.stringify({ id: "cart-1", userId: "user-1", items: [] }), { status: 200 }),
      "/auth/logout": () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    });

    renderNav();

    const logoutButton = await screen.findByRole("button", { name: "Log out" });
    await userEvent.click(logoutButton);

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: "/" }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/logout"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
