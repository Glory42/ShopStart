import { z } from "zod";
import { productSchema } from "./product";

export const wishlistItemSchema = z.object({
  id: z.string().uuid(),
  wishlistId: z.string().uuid(),
  productId: z.string().uuid(),
  product: productSchema.optional(),
  addedAt: z.coerce.date(),
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const wishlistSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(64),
  items: z.array(wishlistItemSchema),
});
export type Wishlist = z.infer<typeof wishlistSchema>;

export const createWishlistSchema = z.object({
  name: z.string().min(1).max(64),
});
export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;

export const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
});
export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
