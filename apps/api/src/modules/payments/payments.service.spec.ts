import { Test } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { PaymentsService } from "./payments.service";
import { PAYMENT_PROVIDER } from "./payment-provider.token";
import { OrdersService } from "../orders/orders.service";
import { CartService } from "../cart/cart.service";
import { AddressesService } from "../addresses/addresses.service";

function decimal(value: number): Prisma.Decimal {
  return { toNumber: () => value } as unknown as Prisma.Decimal;
}

describe("PaymentsService", () => {
  let service: PaymentsService;
  let orders: OrdersService;
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
      // Mirrors the real PrismaService: the transaction callback receives a
      // tx client. Here that's the same mock, so tx.order.* calls hit the
      // same jest.fn()s as calls made outside the transaction.
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
    };
    provider = { charge: jest.fn(), refund: jest.fn() };

    // OrdersService (and its own collaborators) are real instances, not
    // mocks — per docs/adr/0006, mocking is for the PrismaService boundary,
    // not our own classes. This is what lets these tests actually exercise
    // OrdersService's transition guard from PaymentsService, instead of
    // assuming it runs.
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        OrdersService,
        CartService,
        AddressesService,
        { provide: PrismaService, useValue: prisma },
        { provide: PAYMENT_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get(PaymentsService);
    orders = module.get(OrdersService);
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

    it("routes the status write through OrdersService's transition guard", async () => {
      const transitionSpy = jest.spyOn(orders, "transitionStatus");
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

      expect(transitionSpy).toHaveBeenCalledWith(prisma, "order-1", "PAID");
    });

    it("rejects the write when the order is no longer in a transitionable state by the time the transaction runs", async () => {
      // Regression guard for the original bug: PaymentsService used to write
      // Order.status via its own PrismaService transaction, so nothing
      // re-validated the transition against the order's current state once
      // pay()'s own pre-check had passed. Simulate the order having moved to
      // a terminal state between that pre-check and the transactional write
      // (e.g. cancelled concurrently) — going through OrdersService's guard
      // must reject this instead of forcing PAID.
      prisma.order.findUnique
        .mockResolvedValueOnce(pendingOrder) // pay()'s own pre-check
        .mockResolvedValueOnce({ ...pendingOrder, status: "CANCELLED" }); // re-read inside the transaction
      provider.charge.mockResolvedValue({
        id: "payment-1",
        orderId: "order-1",
        status: "SUCCEEDED",
        provider: "stub",
        providerRef: null,
        amount: 48,
        createdAt: new Date(),
      });

      await expect(service.pay("order-1")).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
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
