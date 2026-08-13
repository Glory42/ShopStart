import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import type { CreateReviewInput } from "@shopstart/types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findForProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(productId: string, userId: string, input: CreateReviewInput) {
    const hasDeliveredPurchase = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: "DELIVERED" },
      },
    });
    if (!hasDeliveredPurchase) {
      throw new ForbiddenException(
        "You can only review products from a delivered order",
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) {
      throw new ConflictException("You have already reviewed this product");
    }

    return this.prisma.review.create({
      data: { productId, userId, rating: input.rating, comment: input.comment },
    });
  }
}
