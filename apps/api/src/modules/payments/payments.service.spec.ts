import { Test } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { PaymentsService } from "./payments.service";
import { PAYMENT_PROVIDER } from "./payment-provider.token";

function decimal(value: number): Prisma.Decimal {
  return { toNumber: () => value } as unknown as Prisma.Decimal;
}

describe("PaymentsService", () => {
  let service: PaymentsService;
  let prisma: {
    order: { findUnique: jest.Mock; update: jest.Mock };
    payment: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let provider: { charge: jest.Mock; refund: jest.Mock };

  const pendingOrder = { id: "order-1", status: "PENDING", totalPrice: decimal(48) };

  beforeEach(async () => {
    prisma = {
      order: { findUnique: jest.fn(), update: jest.fn() },
      payment: { create: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    };
    provider = { charge: jest.fn(), refund: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PAYMENT_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  describe("pay", () => {
    it("throws NotFoundException when the order doesn't exist", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.pay("missing")).rejects.toBeInstanceOf(NotFoundException);
      expect(provider.charge).not.toHaveBeenCalled();
    });

    it("rejects paying an order that isn't PENDING (no double-charging)", async () => {
      prisma.order.findUnique.mockResolvedValue({ ...pendingOrder, status: "PAID" });

      await expect(service.pay("order-1")).rejects.toBeInstanceOf(BadRequestException);
      expect(provider.charge).not.toHaveBeenCalled();
    });

    it("charges the provider for the order's current total", async () => {
      prisma.order.findUnique.mockResolvedValue(pendingOrder);
      provider.charge.mockResolvedValue({
        id: "payment-1",
        orderId: "order-1",
        status: "SUCCEEDED",
        provider: "stub",
        providerRef: null,
        amount: 48,
        createdAt: new Date(),
      });

      await service.pay("order-1");

      expect(provider.charge).toHaveBeenCalledWith({ orderId: "order-1", amount: 48 });
    });

    it("marks the order PAID when the charge succeeds", async () => {
      prisma.order.findUnique.mockResolvedValue(pendingOrder);
      provider.charge.mockResolvedValue({
        id: "payment-1",
        orderId: "order-1",
        status: "SUCCEEDED",
        provider: "stub",
        providerRef: null,
        amount: 48,
        createdAt: new Date(),
      });

      await service.pay("order-1");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "PAID" },
      });
    });

    it("leaves the order PENDING when the charge fails", async () => {
      prisma.order.findUnique.mockResolvedValue(pendingOrder);
      provider.charge.mockResolvedValue({
        id: "payment-1",
        orderId: "order-1",
        status: "FAILED",
        provider: "stub",
        providerRef: null,
        amount: 48,
        createdAt: new Date(),
      });

      await service.pay("order-1");

      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.payment.create).toHaveBeenCalled();
    });
  });
});
