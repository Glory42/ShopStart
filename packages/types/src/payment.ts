import { z } from "zod";
import { PaymentStatus } from "./enums";

export const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.nativeEnum(PaymentStatus),
  provider: z.string(),
  providerRef: z.string().nullable(),
  amount: z.number().positive(),
  createdAt: z.coerce.date(),
});
export type Payment = z.infer<typeof paymentSchema>;

/**
 * Implemented by adopters against whichever gateway they use (Stripe, etc).
 * Shopstart ships no concrete implementation — see docs/adr/0003.
 */
export interface PaymentProvider {
  charge(input: { orderId: string; amount: number }): Promise<Payment>;
  refund(paymentId: string): Promise<Payment>;
}
