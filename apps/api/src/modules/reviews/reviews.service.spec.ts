import { Test } from "@nestjs/testing";
import { ConflictException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ReviewsService } from "./reviews.service";

describe("ReviewsService", () => {
  let service: ReviewsService;
  let prisma: {
    orderItem: { findFirst: jest.Mock };
    review: { findUnique: jest.Mock; create: jest.Mock; findMany: jest.Mock };
  };

  const userId = "user-1";
  const productId = "product-1";
  const input = { rating: 5, comment: "Great fit." };

  beforeEach(async () => {
    prisma = {
      orderItem: { findFirst: jest.fn() },
      review: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReviewsService);
  });

  describe("create", () => {
    it("creates a review when the user has a delivered order for the product", async () => {
      prisma.orderItem.findFirst.mockResolvedValue({ id: "order-item-1" });
      prisma.review.findUnique.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue({ id: "review-1", productId, userId, ...input });

      const result = await service.create(productId, userId, input);

      expect(result.id).toBe("review-1");
      expect(prisma.orderItem.findFirst).toHaveBeenCalledWith({
        where: { productId, order: { userId, status: "DELIVERED" } },
      });
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: { productId, userId, rating: input.rating, comment: input.comment },
      });
    });

    it("rejects a review with no delivered purchase (unverified review)", async () => {
      prisma.orderItem.findFirst.mockResolvedValue(null);

      await expect(service.create(productId, userId, input)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it("rejects a second review from the same user on the same product", async () => {
      prisma.orderItem.findFirst.mockResolvedValue({ id: "order-item-1" });
      prisma.review.findUnique.mockResolvedValue({ id: "existing-review", productId, userId });

      await expect(service.create(productId, userId, input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
  });

  describe("findForProduct", () => {
    it("scopes results to the given product", () => {
      service.findForProduct(productId);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId } }),
      );
    });
  });
});
