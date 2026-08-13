import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock };
  };

  const publicUser = {
    id: "user-1",
    email: "customer@shopstart.dev",
    username: "customer",
    phone: null,
    role: "USER",
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  describe("findById", () => {
    it("never selects passwordHash", async () => {
      prisma.user.findUnique.mockResolvedValue(publicUser);

      await service.findById("user-1");

      const select = prisma.user.findUnique.mock.calls[0][0].select;
      expect(select.passwordHash).toBeUndefined();
    });

    it("throws NotFoundException when the user doesn't exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById("missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("findAll", () => {
    it("never selects passwordHash", () => {
      service.findAll();

      const select = prisma.user.findMany.mock.calls[0][0].select;
      expect(select.passwordHash).toBeUndefined();
    });
  });

  describe("update", () => {
    it("throws NotFoundException instead of updating a nonexistent user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update("missing", { username: "new-name" } as never)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("never selects passwordHash on the updated record", async () => {
      prisma.user.findUnique.mockResolvedValue(publicUser);
      prisma.user.update.mockResolvedValue(publicUser);

      await service.update("user-1", { username: "new-name" } as never);

      const select = prisma.user.update.mock.calls[0][0].select;
      expect(select.passwordHash).toBeUndefined();
    });
  });
});
