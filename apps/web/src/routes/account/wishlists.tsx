import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Wishlist } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { Button, buttonClasses } from "../../components/button";
import { Input } from "../../components/input";
import { cn } from "../../lib/cn";

export const Route = createFileRoute("/account/wishlists")({
  component: WishlistsPage,
});

function WishlistsPage() {
  const queryClient = useQueryClient();
  const { data: wishlists, isLoading } = useQuery<Wishlist[]>({
    queryKey: ["wishlists"],
    queryFn: () => api.get<Wishlist[]>("/wishlists"),
  });

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["wishlists"] });
  }

  const createWishlist = useMutation({
    mutationFn: (name: string) => api.post<Wishlist>("/wishlists", { name }),
    onSuccess: () => {
      invalidate();
      setNewName("");
      setShowForm(false);
    },
  });

  const deleteWishlist = useMutation({
    mutationFn: (wishlistId: string) => api.delete(`/wishlists/${wishlistId}`),
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: ({ wishlistId, productId }: { wishlistId: string; productId: string }) =>
      api.delete(`/wishlists/${wishlistId}/items/${productId}`),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="px-5 py-24 text-center text-[15px] text-graphite">
        Loading wishlists...
      </div>
    );
  }

  if (!wishlists || wishlists.length === 0) {
    return (
      <div className="px-5 py-28 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">No wishlists yet</h1>
        <p className="mt-3 text-[15px] text-graphite">
          Save products you love to a named list — create as many as you like.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createWishlist.mutate(newName.trim());
          }}
          className="mx-auto mt-7 flex max-w-xs gap-2"
        >
          <Input
            required
            placeholder="e.g. Birthday"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" variant="invert" disabled={createWishlist.isPending}>
            Create
          </Button>
        </form>
        <Link to="/products" className={cn(buttonClasses("invert"), "mt-7 inline-flex")}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Your wishlists</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-[14px] font-medium text-accent hover:underline"
          >
            + New wishlist
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createWishlist.mutate(newName.trim());
          }}
          className="mb-10 flex gap-2"
        >
          <Input
            autoFocus
            required
            placeholder="e.g. Birthday"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" variant="invert" disabled={createWishlist.isPending}>
            Create
          </Button>
        </form>
      )}

      <ul className="space-y-10">
        {wishlists.map((wishlist) => (
          <li key={wishlist.id}>
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="text-[17px] font-medium text-ink">
                {wishlist.name}{" "}
                <span className="text-[13px] font-normal text-graphite">
                  ({wishlist.items.length})
                </span>
              </h2>
              <button
                onClick={() => deleteWishlist.mutate(wishlist.id)}
                className="text-[13px] text-graphite hover:text-danger"
              >
                Delete list
              </button>
            </div>

            {wishlist.items.length === 0 ? (
              <p className="py-6 text-[14px] text-graphite">Nothing saved here yet.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {wishlist.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-5 py-5">
                    <Link
                      to="/products/$productId"
                      params={{ productId: item.productId }}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-paper-2"
                    >
                      <img
                        src={item.product?.imageUrl ?? undefined}
                        alt={item.product?.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/products/$productId"
                        params={{ productId: item.productId }}
                        className="text-[15px] font-medium text-ink hover:text-graphite"
                      >
                        {item.product?.name}
                      </Link>
                      {item.product && (
                        <p className="mt-1 text-[14px] text-graphite">
                          ${item.product.price.toFixed(2)}
                        </p>
                      )}
                      <button
                        onClick={() =>
                          removeItem.mutate({ wishlistId: wishlist.id, productId: item.productId })
                        }
                        className="mt-2 text-[13px] text-accent hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
