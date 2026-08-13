import { Test } from "@nestjs/testing";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { OrdersService } from "./orders.service";
import { CartService } from "../cart/cart.service";
import { AddressesService } from "../addresses/addresses.service";

function decimal(value: number): Prisma.Decimal {
  return { toNumber: () => value } as unknown as Prisma.Decimal;
}

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: {
    address: { findUnique: jest.Mock };
    cart: { upsert: jest.Mock };
    cartItem: { deleteMany: jest.Mock };
    product: { updateMany: jest.Mock };
    order: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  const userId = "user-1";
  const addressId = "address-1";
  const address = {
    id: addressId,
    userId,
    line1: "1 Main St",
    line2: null,
    city: "Springfield",
    state: "IL",
    postalCode: "62701",
    country: "US",
  };

  beforeEach(async () => {
    prisma = {
      address: { findUnique: jest.fn() },
      cart: { upsert: jest.fn() },
      cartItem: { deleteMany: jest.fn() },
      product: { updateMany: jest.fn() },
      order: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
    };

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        CartService,
        AddressesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe("checkout", () => {
    it("converts a non-empty cart into an order, decrementing stock and clearing the cart", async () => {
      prisma.address.findUnique.mockResolvedValue(address);
      prisma.cart.upsert.mockResolvedValue({
        id: "cart-1",
        userId,
        items: [
          {
            id: "item-1",
            cartId: "cart-1",
            productId: "product-1",
            quantity: 2,
            product: { id: "product-1", name: "Everyday Crew Tee", price: decimal(24) },
          },
        ],
      });
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.create.mockResolvedValue({
        id: "order-1",
        userId,
        status: "PENDING",
        totalPrice: decimal(48),
        shippingLine1: address.line1,
        shippingLine2: address.line2,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: address.country,
        createdAt: new Date(),
        items: [
          {
            id: "order-item-1",
            orderId: "order-1",
            productId: "product-1",
            productName: "Everyday Crew Tee",
            unitPrice: decimal(24),
            quantity: 2,
          },
        ],
        payment: null,
      });

      const result = await service.checkout(userId, { shippingAddressId: addressId });

      expect(result.totalPrice).toBe(48);
      expect(result.items[0].unitPrice).toBe(24);

      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: "product-1", stockQuantity: { gte: 2 } },
        data: { stockQuantity: { decrement: 2 } },
      });

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            status: "PENDING",
            totalPrice: 48,
            items: {
              create: [
                { productId: "product-1", productName: "Everyday Crew Tee", unitPrice: 24, quantity: 2 },
              ],
            },
          }),
        }),
      );

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: "cart-1" } });
    });

    it("rejects checkout when a cart item's stock was already claimed by another order", async () => {
      prisma.address.findUnique.mockResolvedValue(address);
      prisma.cart.upsert.mockResolvedValue({
        id: "cart-1",
        userId,
        items: [
          {
            id: "item-1",
            cartId: "cart-1",
            productId: "product-1",
            quantity: 5,
            product: { id: "product-1", name: "Everyday Crew Tee", price: decimal(24) },
          },
        ],
      });
      // updateMany's WHERE clause requires stockQuantity >= quantity; count 0 means
      // the guarded update matched no row, i.e. stock ran out concurrently.
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.checkout(userId, { shippingAddressId: addressId }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.order.create).not.toHaveBeenCalled();
      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("allows a valid forward transition (PENDING -> PAID)", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: "order-1", status: "PENDING" });
      prisma.order.update.mockResolvedValue({
        id: "order-1",
        userId,
        status: "PAID",
        totalPrice: decimal(48),
        shippingLine1: address.line1,
        shippingLine2: address.line2,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: address.country,
        createdAt: new Date(),
        items: [],
        payment: null,
      });

      const result = await service.updateStatus("order-1", "PAID");

      expect(result.status).toBe("PAID");
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "order-1" }, data: { status: "PAID" } }),
      );
    });

    it("rejects a transition that skips states (PENDING -> DELIVERED)", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: "order-1", status: "PENDING" });

      await expect(service.updateStatus("order-1", "DELIVERED")).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it("rejects any transition out of a terminal state (CANCELLED -> PAID)", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: "order-1", status: "CANCELLED" });

      await expect(service.updateStatus("order-1", "PAID")).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    const order = {
      id: "order-1",
      userId,
      status: "PENDING",
      totalPrice: decimal(48),
      shippingLine1: address.line1,
      shippingLine2: address.line2,
      shippingCity: address.city,
      shippingState: address.state,
      shippingPostalCode: address.postalCode,
      shippingCountry: address.country,
      createdAt: new Date(),
      items: [],
      payment: null,
    };

    it("returns the order for its owner", async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findById(userId, "order-1", false);

      expect(result.id).toBe("order-1");
    });

    it("returns the order for an admin regardless of owner", async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findById("someone-else", "order-1", true);

      expect(result.id).toBe("order-1");
    });

    it("rejects a non-admin reading another user's order", async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      await expect(service.findById("someone-else", "order-1", false)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("throws NotFoundException when the order doesn't exist", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findById(userId, "missing", false)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("findForUser", () => {
    it("scopes results to the given user", async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.findForUser(userId);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
    });
  });

  describe("findAllAdmin", () => {
    it("returns orders across all users, unscoped", async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.findAllAdmin();

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({ where: expect.anything() }),
      );
    });
  });
});
