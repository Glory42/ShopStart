import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Wishlist } from "@shopstart/types";
import { useSession } from "../lib/session";
import { api } from "../lib/api-client";
import { cn } from "../lib/cn";

type WishlistButtonProps = {
  productId: string;
  /**
   * "icon": bare glyph button for the product-card image plate.
   * "button": labeled bordered pill for the product-detail buy-box.
   */
  variant?: "icon" | "button";
  className?: string;
};

/**
 * design.md § "Wishlist save toggle" (added for issue #15). A fifth CTA
 * voice, distinct from the four pill CTAs: ♥/♡ glyphs (reusing the
 * typographic-icon convention already established for star ratings) rather
 * than a new icon set, opening a popover to pick which of the user's
 * wishlists the product belongs to (a product may be saved in more than
 * one). Rendered as a sibling of any wrapping <Link> by callers — never
 * nested inside one, to avoid interactive-in-interactive markup.
 */
export function WishlistButton({ productId, variant = "icon", className }: WishlistButtonProps) {
  const { data: user } = useSession();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const queryClient = useQueryClient();

  const { data: wishlists } = useQuery<Wishlist[]>({
    queryKey: ["wishlists"],
    queryFn: () => api.get<Wishlist[]>("/wishlists"),
    enabled: Boolean(user),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["wishlists"] });
  }

  const addItem = useMutation({
    mutationFn: (wishlistId: string) => api.post(`/wishlists/${wishlistId}/items`, { productId }),
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: (wishlistId: string) => api.delete(`/wishlists/${wishlistId}/items/${productId}`),
    onSuccess: invalidate,
  });

  const createWishlist = useMutation({
    mutationFn: (name: string) => api.post<Wishlist>("/wishlists", { name }),
    onSuccess: (wishlist) => {
      invalidate();
      addItem.mutate(wishlist.id);
      setNewName("");
    },
  });

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label="Log in to save to a wishlist"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-canvas/85 text-[18px] text-graphite backdrop-blur transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          className,
        )}
      >
        ♡
      </Link>
    );
  }

  const isSaved = (wishlists ?? []).some((w) => w.items.some((item) => item.productId === productId));
  const glyph = isSaved ? "♥" : "♡";
  const label = isSaved ? "Saved to wishlist" : "Save to wishlist";

  return (
    <div className={cn(variant === "button" && "relative inline-block", className)}>
      {variant === "icon" ? (
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-canvas/85 text-[18px] backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            isSaved ? "text-accent" : "text-graphite hover:text-ink",
          )}
        >
          {glyph}
        </button>
      ) : (
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-12 items-center gap-2 rounded-full border px-5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            isSaved ? "border-accent text-accent" : "border-hairline text-ink hover:border-ink",
          )}
        >
          <span aria-hidden className="text-[16px]">
            {glyph}
          </span>
          {label}
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-hairline bg-paper-3 p-3 shadow-xl">
          <p className="eyebrow mb-2 px-1">Save to</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {(wishlists ?? []).map((wishlist) => {
              const checked = wishlist.items.some((item) => item.productId === productId);
              return (
                <li key={wishlist.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-[14px] text-ink hover:bg-paper-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        checked ? removeItem.mutate(wishlist.id) : addItem.mutate(wishlist.id)
                      }
                      className="accent-accent"
                    />
                    {wishlist.name}
                  </label>
                </li>
              );
            })}
            {wishlists?.length === 0 && (
              <li className="px-2 py-1 text-[13px] text-graphite">No wishlists yet.</li>
            )}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) createWishlist.mutate(newName.trim());
            }}
            className="mt-2 flex gap-2 border-t border-hairline pt-2"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New wishlist"
              className="w-full rounded-lg border border-hairline bg-paper-2 px-2 py-1.5 text-[13px] text-ink placeholder:text-graphite focus-visible:border-accent focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!newName.trim() || createWishlist.isPending}
              className="shrink-0 text-[13px] font-medium text-accent hover:underline disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
