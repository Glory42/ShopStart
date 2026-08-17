import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WishlistButton } from "./wishlist-button";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    to,
    ...rest
  }: {
    children: ReactNode;
    className?: string;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  ),
}));

const productId = "33333333-3333-4333-8333-333333333333";
const homeOfficeId = "44444444-4444-4444-8444-444444444444";
const birthdayId = "55555555-5555-4555-8555-555555555555";

const wishlists = [
  { id: homeOfficeId, userId: "user-1", name: "Home office", items: [] },
  {
    id: birthdayId,
    userId: "user-1",
    name: "Birthday",
    items: [
      {
        id: "item-1",
        wishlistId: birthdayId,
        productId,
        addedAt: new Date().toISOString(),
      },
    ],
  },
];

type Route = { method: string; urlIncludes: string; response: (init?: RequestInit) => Response };

function mockFetch(routes: Route[]) {
  const fn = vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const match = routes.find((r) => method === r.method && url.includes(r.urlIncludes));
    if (!match) throw new Error(`Unhandled fetch in test: ${method} ${url}`);
    return Promise.resolve(match.response(init));
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const authMe = (status: number, body: unknown): Route => ({
  method: "GET",
  urlIncludes: "/auth/me",
  response: () => new Response(JSON.stringify(body), { status }),
});

const signedOut = authMe(401, { message: "Unauthorized" });
const signedIn = authMe(200, { id: "user-1", email: "a@b.com" });

const listWishlists = (data: unknown = wishlists): Route => ({
  method: "GET",
  urlIncludes: "/wishlists",
  response: () => new Response(JSON.stringify(data), { status: 200 }),
});

function renderButton(props: Partial<{ variant: "icon" | "button" }> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <WishlistButton productId={productId} {...props} />
    </QueryClientProvider>,
  );
}

describe("WishlistButton", () => {
  it("shows a login link instead of a toggle when signed out", async () => {
    mockFetch([signedOut]);

    renderButton();

    const link = await screen.findByRole("link", { name: "Log in to save to a wishlist" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows a filled/'Saved' toggle once the product is saved somewhere", async () => {
    mockFetch([signedIn, listWishlists()]);

    renderButton();

    expect(await screen.findByRole("button", { name: "Saved to wishlist" })).toBeInTheDocument();
  });

  it("shows an unfilled/'Save' toggle when the product is saved nowhere", async () => {
    mockFetch([signedIn, listWishlists([{ id: homeOfficeId, userId: "user-1", name: "Home office", items: [] }])]);

    renderButton();

    expect(await screen.findByRole("button", { name: "Save to wishlist" })).toBeInTheDocument();
  });

  it("opens a panel listing the user's wishlists with the right ones checked", async () => {
    mockFetch([signedIn, listWishlists()]);

    renderButton();

    await userEvent.click(await screen.findByRole("button", { name: "Saved to wishlist" }));

    expect(screen.getByRole("checkbox", { name: "Home office" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Birthday" })).toBeChecked();
  });

  it("adds the product to a wishlist when its checkbox is checked", async () => {
    const fetchMock = mockFetch([
      signedIn,
      listWishlists(),
      { method: "POST", urlIncludes: `/wishlists/${homeOfficeId}/items`, response: () => new Response(JSON.stringify({}), { status: 201 }) },
    ]);

    renderButton();

    await userEvent.click(await screen.findByRole("button", { name: /wishlist/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Home office" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/wishlists/${homeOfficeId}/items`),
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const call = fetchMock.mock.calls.find(
      (args) =>
        (args[0] as string).includes(`/wishlists/${homeOfficeId}/items`) &&
        (args[1] as RequestInit).method === "POST",
    )!;
    expect(JSON.parse((call[1] as RequestInit).body as string)).toEqual({ productId });
  });

  it("removes the product from a wishlist when its checkbox is unchecked", async () => {
    const fetchMock = mockFetch([
      signedIn,
      listWishlists(),
      {
        method: "DELETE",
        urlIncludes: `/wishlists/${birthdayId}/items/${productId}`,
        response: () => new Response(JSON.stringify({}), { status: 200 }),
      },
    ]);

    renderButton();

    await userEvent.click(await screen.findByRole("button", { name: /wishlist/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Birthday" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/wishlists/${birthdayId}/items/${productId}`),
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });

  it("creates a new wishlist and adds the product to it", async () => {
    const newWishlistId = "66666666-6666-4666-8666-666666666666";
    const fetchMock = mockFetch([
      signedIn,
      listWishlists(),
      {
        method: "POST",
        urlIncludes: `/wishlists/${newWishlistId}/items`,
        response: () => new Response(JSON.stringify({}), { status: 201 }),
      },
      {
        method: "POST",
        urlIncludes: "/wishlists",
        response: () =>
          new Response(JSON.stringify({ id: newWishlistId, userId: "user-1", name: "Winter" }), {
            status: 201,
          }),
      },
    ]);

    renderButton();

    await userEvent.click(await screen.findByRole("button", { name: /wishlist/ }));
    await userEvent.type(screen.getByPlaceholderText("New wishlist"), "Winter");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/wishlists/${newWishlistId}/items`),
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("renders a labeled pill for the 'button' variant", async () => {
    mockFetch([signedIn, listWishlists([])]);

    renderButton({ variant: "button" });

    expect(await screen.findByRole("button", { name: "Save to wishlist" })).toBeInTheDocument();
  });
});
