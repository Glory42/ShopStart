import { z } from "zod";
import { OrderStatus } from "./enums";
import { paymentSchema } from "./payment";

/**
 * A snapshot of a Product's price and name at the moment of purchase.
 * Deliberately does not reference the live Product price — see CONTEXT.md.
 */
export const orderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

/**
 * Flat shippingLine1/City/etc fields, not a nested address object — this is a
 * frozen snapshot of the Address used at checkout, not a live relation. See
 * CONTEXT.md.
 */
export const orderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  items: z.array(orderItemSchema),
  shippingLine1: z.string(),
  shippingLine2: z.string().nullable(),
  shippingCity: z.string(),
  shippingState: z.string(),
  shippingPostalCode: z.string(),
  shippingCountry: z.string(),
  totalPrice: z.number().positive(),
  payment: paymentSchema.nullable(),
  createdAt: z.coerce.date(),
});
export type Order = z.infer<typeof orderSchema>;

export const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/** Valid forward transitions. Enforced by OrdersService, not just the type. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
  DELIVERED: [OrderStatus.REFUNDED],
  CANCELLED: [],
  REFUNDED: [],
};
