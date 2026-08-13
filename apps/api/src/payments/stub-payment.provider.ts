import { Injectable } from "@nestjs/common";
import type { Payment, PaymentProvider } from "@shopstart/types";

/**
 * Always-succeeds stand-in so checkout can be exercised end-to-end locally.
 * Not a real gateway integration — see docs/adr/0003. Replace with a real
 * PaymentProvider (Stripe, etc.) and swap the DI binding in payments.module.ts.
 */
@Injectable()
export class StubPaymentProvider implements PaymentProvider {
  async charge(input: { orderId: string; amount: number }): Promise<Payment> {
    return {
      id: crypto.randomUUID(),
      orderId: input.orderId,
      status: "SUCCEEDED",
      provider: "stub",
      providerRef: null,
      amount: input.amount,
      createdAt: new Date(),
    };
  }

  async refund(paymentId: string): Promise<Payment> {
    throw new Error(`StubPaymentProvider cannot refund payment ${paymentId} — implement a real PaymentProvider`);
  }
}
