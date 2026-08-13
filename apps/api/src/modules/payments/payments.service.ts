import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PaymentProvider } from "@shopstart/types";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { decimalToNumber } from "../../common/decimal";
import { PAYMENT_PROVIDER } from "./payment-provider.token";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async pay(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== "PENDING") {
      throw new BadRequestException("Only pending orders can be paid");
    }

    const result = await this.provider.charge({
      orderId,
      amount: decimalToNumber(order.totalPrice),
    });

    await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          orderId,
          status: result.status,
          provider: result.provider,
          providerRef: result.providerRef,
          amount: result.amount,
        },
      }),
      ...(result.status === "SUCCEEDED"
        ? [this.prisma.order.update({ where: { id: orderId }, data: { status: "PAID" as const } })]
        : []),
    ]);

    return result;
  }
}
