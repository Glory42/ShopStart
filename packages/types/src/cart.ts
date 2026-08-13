import { z } from "zod";
import { productSchema } from "./product";

export const cartItemSchema = z.object({
  id: z.string().uuid(),
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  product: productSchema.optional(),
  quantity: z.number().int().min(1),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  items: z.array(cartItemSchema),
});
export type Cart = z.infer<typeof cartSchema>;

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
