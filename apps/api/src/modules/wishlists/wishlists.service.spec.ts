import { Test } from "@nestjs/testing";
import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { WishlistsService } from "./wishlists.service";

describe("WishlistsService", () => {
  let service: WishlistsService;
  let prisma: {
    wishlist: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
    wishlistItem: { upsert: jest.Mock; deleteMany: jest.Mock };
  };

  const userId = "user-1";
  const otherUserId = "user-2";
  const wishlistId = "wishlist-1";
  const productId = "product-1";

  beforeEach(async () => {
    prisma = {
      wishlist: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      wishlistItem: { upsert: jest.fn(), deleteMany: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [WishlistsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(WishlistsService);
  });

  describe("listForUser", () => {
    it("scopes results to the given user", () => {
      service.listForUser(userId);

      expect(prisma.wishlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
    });
  });

  describe("create", () => {
    it("creates a wishlist for the user when the name is unique", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(null);
      prisma.wishlist.create.mockResolvedValue({ id: wishlistId, userId, name: "Birthday" });

      const result = await service.create(userId, { name: "Birthday" });

      expect(result.id).toBe(wishlistId);
      expect(prisma.wishlist.findUnique).toHaveBeenCalledWith({
        where: { userId_name: { userId, name: "Birthday" } },
      });
      expect(prisma.wishlist.create).toHaveBeenCalledWith({
        data: { userId, name: "Birthday" },
      });
    });

    it("rejects a duplicate wishlist name for the same user", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({ id: wishlistId, userId, name: "Birthday" });

      await expect(service.create(userId, { name: "Birthday" })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.wishlist.create).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes a wishlist owned by the user", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({ id: wishlistId, userId, name: "Birthday" });

      await service.remove(userId, wishlistId);

      expect(prisma.wishlist.delete).toHaveBeenCalledWith({ where: { id: wishlistId } });
    });

    it("throws NotFoundException when the wishlist does not exist", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, wishlistId)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when the wishlist belongs to another user", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({
        id: wishlistId,
        userId: otherUserId,
        name: "Birthday",
      });

      await expect(service.remove(userId, wishlistId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
    });
  });

  describe("addItem", () => {
    it("upserts the item into a wishlist owned by the user", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({ id: wishlistId, userId, name: "Birthday" });
      prisma.wishlistItem.upsert.mockResolvedValue({ id: "item-1", wishlistId, productId });
      prisma.wishlist.findMany.mockResolvedValue([]);

      await service.addItem(userId, wishlistId, { productId });

      expect(prisma.wishlistItem.upsert).toHaveBeenCalledWith({
        where: { wishlistId_productId: { wishlistId, productId } },
        create: { wishlistId, productId },
        update: {},
      });
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
    });

    it("throws ForbiddenException when adding to another user's wishlist", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({
        id: wishlistId,
        userId: otherUserId,
        name: "Birthday",
      });

      await expect(
        service.addItem(userId, wishlistId, { productId }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.wishlistItem.upsert).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the wishlist does not exist", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(userId, wishlistId, { productId }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.wishlistItem.upsert).not.toHaveBeenCalled();
    });
  });

  describe("removeItem", () => {
    it("removes the item from a wishlist owned by the user", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({ id: wishlistId, userId, name: "Birthday" });
      prisma.wishlistItem.deleteMany.mockResolvedValue({ count: 1 });
      prisma.wishlist.findMany.mockResolvedValue([]);

      await service.removeItem(userId, wishlistId, productId);

      expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { wishlistId, productId },
      });
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
    });

    it("throws ForbiddenException when removing from another user's wishlist", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({
        id: wishlistId,
        userId: otherUserId,
        name: "Birthday",
      });

      await expect(
        service.removeItem(userId, wishlistId, productId),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.wishlistItem.deleteMany).not.toHaveBeenCalled();
    });
  });
});
