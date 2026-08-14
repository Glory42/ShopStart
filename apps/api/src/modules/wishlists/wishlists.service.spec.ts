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

  const ownedWishlist = { id: wishlistId, userId, name: "Birthday" };

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
    it("returns only the requesting user's wishlists, with their products", async () => {
      prisma.wishlist.findMany.mockResolvedValue([ownedWishlist]);

      const result = await service.listForUser(userId);

      expect(result).toEqual([ownedWishlist]);
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
    });
  });

  describe("create", () => {
    it("creates a wishlist for the user", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(null);
      prisma.wishlist.create.mockResolvedValue(ownedWishlist);

      const result = await service.create(userId, { name: "Birthday" });

      expect(result).toEqual(ownedWishlist);
      expect(prisma.wishlist.create).toHaveBeenCalledWith({
        data: { userId, name: "Birthday" },
      });
    });

    it("rejects a duplicate name for the same user", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(ownedWishlist);

      await expect(service.create(userId, { name: "Birthday" })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.wishlist.create).not.toHaveBeenCalled();
    });

    it("scopes the duplicate-name check to the user", async () => {
      // Two users may both have a "Birthday" list; the unique key is the pair.
      prisma.wishlist.findUnique.mockResolvedValue(null);
      prisma.wishlist.create.mockResolvedValue(ownedWishlist);

      await service.create(userId, { name: "Birthday" });

      expect(prisma.wishlist.findUnique).toHaveBeenCalledWith({
        where: { userId_name: { userId, name: "Birthday" } },
      });
    });
  });

  describe("remove", () => {
    it("deletes a wishlist the user owns", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(ownedWishlist);

      await service.remove(userId, wishlistId);

      expect(prisma.wishlist.delete).toHaveBeenCalledWith({ where: { id: wishlistId } });
    });

    it("refuses to delete another user's wishlist", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({ ...ownedWishlist, userId: otherUserId });

      await expect(service.remove(userId, wishlistId)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
    });

    it("reports a missing wishlist as not found", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, wishlistId)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
    });
  });

  describe("addItem", () => {
    it("adds a product and returns the user's refreshed lists", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(ownedWishlist);
      prisma.wishlist.findMany.mockResolvedValue([ownedWishlist]);

      const result = await service.addItem(userId, wishlistId, { productId });

      expect(result).toEqual([ownedWishlist]);
      expect(prisma.wishlistItem.upsert).toHaveBeenCalledWith({
        where: { wishlistId_productId: { wishlistId, productId } },
        create: { wishlistId, productId },
        update: {},
      });
    });

    it("is idempotent: adding the same product twice does not error", async () => {
      // upsert with an empty update is what makes a double-add a no-op.
      prisma.wishlist.findUnique.mockResolvedValue(ownedWishlist);
      prisma.wishlist.findMany.mockResolvedValue([ownedWishlist]);

      await service.addItem(userId, wishlistId, { productId });
      await service.addItem(userId, wishlistId, { productId });

      expect(prisma.wishlistItem.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.wishlistItem.upsert.mock.calls[1][0].update).toEqual({});
    });

    it("refuses to add to another user's wishlist", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({ ...ownedWishlist, userId: otherUserId });

      await expect(service.addItem(userId, wishlistId, { productId })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.wishlistItem.upsert).not.toHaveBeenCalled();
    });

    it("reports a missing wishlist as not found", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(null);

      await expect(service.addItem(userId, wishlistId, { productId })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.wishlistItem.upsert).not.toHaveBeenCalled();
    });
  });

  describe("removeItem", () => {
    it("removes a product and returns the user's refreshed lists", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(ownedWishlist);
      prisma.wishlist.findMany.mockResolvedValue([ownedWishlist]);

      const result = await service.removeItem(userId, wishlistId, productId);

      expect(result).toEqual([ownedWishlist]);
      expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { wishlistId, productId },
      });
    });

    it("refuses to remove from another user's wishlist", async () => {
      prisma.wishlist.findUnique.mockResolvedValue({ ...ownedWishlist, userId: otherUserId });

      await expect(service.removeItem(userId, wishlistId, productId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.wishlistItem.deleteMany).not.toHaveBeenCalled();
    });

    it("reports a missing wishlist as not found", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(null);

      await expect(service.removeItem(userId, wishlistId, productId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.wishlistItem.deleteMany).not.toHaveBeenCalled();
    });

    it("removing a product that is not on the list is a no-op, not an error", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(ownedWishlist);
      prisma.wishlist.findMany.mockResolvedValue([ownedWishlist]);
      prisma.wishlistItem.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.removeItem(userId, wishlistId, "never-added"),
      ).resolves.toEqual([ownedWishlist]);
    });
  });
});
