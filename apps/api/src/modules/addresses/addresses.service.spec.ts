import { Test } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AddressesService } from "./addresses.service";

describe("AddressesService", () => {
  let service: AddressesService;
  let prisma: {
    address: { findUnique: jest.Mock; delete: jest.Mock };
  };

  const userId = "user-1";
  const address = { id: "address-1", userId, line1: "1 Main St", city: "Springfield" };

  beforeEach(async () => {
    prisma = {
      address: { findUnique: jest.fn(), delete: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [AddressesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AddressesService);
  });

  describe("remove", () => {
    it("rejects deleting another user's address", async () => {
      prisma.address.findUnique.mockResolvedValue(address);

      await expect(service.remove("someone-else", "address-1")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.address.delete).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the address doesn't exist", async () => {
      prisma.address.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, "missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("requireOwned", () => {
    it("returns the address when owned by the user", async () => {
      prisma.address.findUnique.mockResolvedValue(address);

      await expect(service.requireOwned(userId, "address-1")).resolves.toBe(address);
    });

    it("rejects an address owned by someone else", async () => {
      prisma.address.findUnique.mockResolvedValue(address);

      await expect(service.requireOwned("someone-else", "address-1")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("throws NotFoundException when the address doesn't exist", async () => {
      prisma.address.findUnique.mockResolvedValue(null);

      await expect(service.requireOwned(userId, "missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
