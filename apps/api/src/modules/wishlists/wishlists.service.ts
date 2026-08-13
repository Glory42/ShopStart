import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AddToWishlistInput, CreateWishlistInput } from "@shopstart/types";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class WishlistsService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async create(userId: string, input: CreateWishlistInput) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_name: { userId, name: input.name } },
    });
    if (existing) throw new ConflictException("You already have a wishlist with that name");
    return this.prisma.wishlist.create({ data: { userId, name: input.name } });
  }

  private async requireOwned(userId: string, wishlistId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    if (!wishlist) throw new NotFoundException("Wishlist not found");
    if (wishlist.userId !== userId) throw new ForbiddenException();
    return wishlist;
  }

  async remove(userId: string, wishlistId: string) {
    await this.requireOwned(userId, wishlistId);
    await this.prisma.wishlist.delete({ where: { id: wishlistId } });
  }

  async addItem(userId: string, wishlistId: string, input: AddToWishlistInput) {
    const wishlist = await this.requireOwned(userId, wishlistId);
    await this.prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: { wishlistId: wishlist.id, productId: input.productId },
      },
      create: { wishlistId: wishlist.id, productId: input.productId },
      update: {},
    });
    return this.listForUser(userId);
  }

  async removeItem(userId: string, wishlistId: string, productId: string) {
    const wishlist = await this.requireOwned(userId, wishlistId);
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId },
    });
    return this.listForUser(userId);
  }
}
