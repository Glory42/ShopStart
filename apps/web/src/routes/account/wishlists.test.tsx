import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../test-router";

const wishlistId = "44444444-4444-4444-8444-444444444444";
const productId = "33333333-3333-4333-8333-333333333333";

function wishlistsResponse(wishlists: unknown[]) {
  return { method: "GET", urlIncludes: "/wishlists", response: () => new Response(JSON.stringify(wishlists), { status: 200 }) } as const;
}

const oneWishlistWithItem = [
  {
    id: wishlistId,
    userId: "user-1",
    name: "Birthday",
    items: [
      {
        id: "item-1",
        wishlistId,
        productId,
        product: { id: productId, name: "Everyday Crew Tee", price: 24, imageUrl: "https://placehold.co/600x600" },
        addedAt: new Date().toISOString(),
      },
    ],
  },
];

describe("WishlistsPage", () => {
  it("shows an empty state with a create form when the user has no wishlists", async () => {
    await renderRoute("/account/wishlists", [wishlistsResponse([])]);

    await waitFor(() => expect(screen.getByText("No wishlists yet")).toBeInTheDocument());
    expect(screen.getByPlaceholderText("e.g. Birthday")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start shopping" })).toBeInTheDocument();
  });

  it("creates a wishlist from the empty state", async () => {
    await renderRoute("/account/wishlists", [
      wishlistsResponse([]),
      { method: "POST", urlIncludes: "/wishlists", response: () => new Response(JSON.stringify({ id: wishlistId, userId: "user-1", name: "Birthday" }), { status: 201 }) },
    ]);

    await waitFor(() => expect(screen.getByText("No wishlists yet")).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText("e.g. Birthday"), "Birthday");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(
        (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
          (args: unknown[]) =>
            (args[0] as string).includes("/wishlists") &&
            (args[1] as RequestInit)?.method === "POST",
        ),
      ).toBe(true),
    );
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (args: unknown[]) => (args[0] as string).includes("/wishlists") && (args[1] as RequestInit)?.method === "POST",
    ) as [string, RequestInit];
    expect(JSON.parse(call[1].body as string)).toEqual({ name: "Birthday" });
  });

  it("renders a wishlist's name, item count, and items", async () => {
    await renderRoute("/account/wishlists", [wishlistsResponse(oneWishlistWithItem)]);

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Birthday (1)" })).toBeInTheDocument(),
    );
    expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument();
    expect(screen.getByText("$24.00")).toBeInTheDocument();
  });

  it("removes an item from a wishlist", async () => {
    await renderRoute("/account/wishlists", [
      wishlistsResponse(oneWishlistWithItem),
      {
        method: "DELETE",
        urlIncludes: `/wishlists/${wishlistId}/items/${productId}`,
        response: () => new Response(JSON.stringify({}), { status: 200 }),
      },
    ]);

    await userEvent.click(await screen.findByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(
        (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
          (args: unknown[]) =>
            (args[0] as string).includes(`/wishlists/${wishlistId}/items/${productId}`) &&
            (args[1] as RequestInit)?.method === "DELETE",
        ),
      ).toBe(true),
    );
  });

  it("deletes a whole wishlist", async () => {
    await renderRoute("/account/wishlists", [
      wishlistsResponse(oneWishlistWithItem),
      {
        method: "DELETE",
        urlIncludes: `/wishlists/${wishlistId}`,
        response: () => new Response(JSON.stringify({}), { status: 200 }),
      },
    ]);

    await userEvent.click(await screen.findByRole("button", { name: "Delete list" }));

    await waitFor(() =>
      expect(
        (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
          (args: unknown[]) =>
            (args[0] as string).includes(`/wishlists/${wishlistId}`) &&
            (args[1] as RequestInit)?.method === "DELETE",
        ),
      ).toBe(true),
    );
  });

  it("reveals a create-new-wishlist form and submits it when the user already has a wishlist", async () => {
    await renderRoute("/account/wishlists", [
      wishlistsResponse(oneWishlistWithItem),
      { method: "POST", urlIncludes: "/wishlists", response: () => new Response(JSON.stringify({ id: "new-id", userId: "user-1", name: "Home office" }), { status: 201 }) },
    ]);

    await userEvent.click(await screen.findByRole("button", { name: "+ New wishlist" }));
    await userEvent.type(screen.getByPlaceholderText("e.g. Birthday"), "Home office");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(
        (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
          (args: unknown[]) =>
            (args[0] as string).includes("/wishlists") &&
            (args[1] as RequestInit)?.method === "POST",
        ),
      ).toBe(true),
    );
  });
});
