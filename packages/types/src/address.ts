import { z } from "zod";

export const addressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  line1: z.string().min(1),
  line2: z.string().nullable().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2),
  createdAt: z.coerce.date(),
});
export type Address = z.infer<typeof addressSchema>;

export const createAddressSchema = addressSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type CreateAddressInput = z.infer<typeof createAddressSchema>;

/** Frozen copy of an Address embedded in an Order at checkout time. */
export const orderAddressSnapshotSchema = createAddressSchema;
export type OrderAddressSnapshot = z.infer<typeof orderAddressSnapshotSchema>;
