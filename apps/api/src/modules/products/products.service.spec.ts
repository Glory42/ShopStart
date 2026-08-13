import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ProductsService } from "./products.service";

function decimal(value: number): Prisma.Decimal {
  return { toNumber: () => value } as unknown as Prisma.Decimal;
}

describe("ProductsService", () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const product = { id: "product-1", name: "Everyday Crew Tee", price: decimal(24), category: null };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ProductsService);
  });

  describe("findAll", () => {
    it("paginates using (page - 1) * pageSize as the offset", async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll({ page: 3, pageSize: 10 } as never);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it("filters to only in-stock products when inStock is set", async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, pageSize: 10, inStock: true } as never);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ stockQuantity: { gt: 0 } }),
        }),
      );
    });

    it("serializes each product's price from Decimal to number", async () => {
      prisma.product.findMany.mockResolvedValue([product]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 } as never);

      expect(result.items[0].price).toBe(24);
      expect(result.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("returns the product with its price serialized", async () => {
      prisma.product.findUnique.mockResolvedValue(product);

      const result = await service.findById("product-1");

      expect(result.price).toBe(24);
    });

    it("throws NotFoundException when the product doesn't exist", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findById("missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("update", () => {
    it("throws NotFoundException instead of updating a nonexistent product", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update("missing", { name: "New name" } as never)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("throws NotFoundException instead of deleting a nonexistent product", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove("missing")).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });
  });
});
