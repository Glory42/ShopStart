import { Test } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CartService } from "./cart.service";

function decimal(value: number): Prisma.Decimal {
  return { toNumber: () => value } as unknown as Prisma.Decimal;
}

describe("CartService", () => {
  let service: CartService;
  let prisma: {
    cart: { upsert: jest.Mock };
    product: { findUnique: jest.Mock };
    cartItem: { upsert: jest.Mock; update: jest.Mock; delete: jest.Mock; deleteMany: jest.Mock };
  };

  const userId = "user-1";
  const rawCart = (items: unknown[] = []) => ({ id: "cart-1", userId, items });
  const rawItem = (overrides: Partial<{ id: string; productId: string; quantity: number; price: number }> = {}) => ({
    id: overrides.id ?? "item-1",
    cartId: "cart-1",
    productId: overrides.productId ?? "product-1",
    quantity: overrides.quantity ?? 2,
    product: { id: overrides.productId ?? "product-1", name: "Everyday Crew Tee", price: decimal(overrides.price ?? 24) },
  });

  beforeEach(async () => {
    prisma = {
      cart: { upsert: jest.fn() },
      product: { findUnique: jest.fn() },
      cartItem: { upsert: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CartService);
  });

  describe("getOrCreate", () => {
    it("serializes item prices from Decimal to number", async () => {
      prisma.cart.upsert.mockResolvedValue(rawCart([rawItem({ price: 24 })]));

      const result = await service.getOrCreate(userId);

      expect(result.items[0].product.price).toBe(24);
    });
  });

  describe("addItem", () => {
    it("adds a new item for a product that isn't in the cart yet", async () => {
      prisma.cart.upsert
        .mockResolvedValueOnce(rawCart([]))
        .mockResolvedValueOnce(rawCart([rawItem()]));
      prisma.product.findUnique.mockResolvedValue({ id: "product-1", name: "Everyday Crew Tee" });

      await service.addItem(userId, { productId: "product-1", quantity: 2 });

      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: { cartId_productId: { cartId: "cart-1", productId: "product-1" } },
        create: { cartId: "cart-1", productId: "product-1", quantity: 2 },
        update: { quantity: { increment: 2 } },
      });
    });

    it("rejects adding a product that doesn't exist", async () => {
      prisma.cart.upsert.mockResolvedValue(rawCart([]));
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(userId, { productId: "missing-product", quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
    });
  });

  describe("updateItem", () => {
    it("updates the quantity of an item already in the cart", async () => {
      prisma.cart.upsert
        .mockResolvedValueOnce(rawCart([rawItem({ id: "item-1", productId: "product-1" })]))
        .mockResolvedValueOnce(rawCart([rawItem({ id: "item-1", productId: "product-1", quantity: 5 })]));

      await service.updateItem(userId, "product-1", { quantity: 5 });

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { quantity: 5 },
      });
    });

    it("throws NotFoundException when the product isn't in the cart", async () => {
      prisma.cart.upsert.mockResolvedValue(rawCart([]));

      await expect(
        service.updateItem(userId, "not-in-cart", { quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("removeItem", () => {
    it("deletes an item already in the cart", async () => {
      prisma.cart.upsert
        .mockResolvedValueOnce(rawCart([rawItem({ id: "item-1", productId: "product-1" })]))
        .mockResolvedValueOnce(rawCart([]));

      await service.removeItem(userId, "product-1");

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: "item-1" } });
    });

    it("throws NotFoundException when the product isn't in the cart", async () => {
      prisma.cart.upsert.mockResolvedValue(rawCart([]));

      await expect(service.removeItem(userId, "not-in-cart")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("requireNonEmpty", () => {
    it("returns the serialized cart (Decimal price converted to number) when it has items", async () => {
      prisma.cart.upsert.mockResolvedValue(rawCart([rawItem({ price: 24 })]));

      const result = await service.requireNonEmpty(userId);

      expect(result.items[0].product.price).toBe(24);
    });

    it("rejects an empty cart", async () => {
      prisma.cart.upsert.mockResolvedValue(rawCart([]));

      await expect(service.requireNonEmpty(userId)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("clear", () => {
    it("deletes all items for the given cart", () => {
      service.clear("cart-1");

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: "cart-1" } });
    });
  });
});
