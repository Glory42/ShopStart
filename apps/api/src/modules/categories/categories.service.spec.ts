import { Test } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CategoriesService } from "./categories.service";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let prisma: {
    category: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      category: { findUnique: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  it("rejects a duplicate slug", async () => {
    prisma.category.findUnique.mockResolvedValue({ id: "1", name: "Books", slug: "books" });

    await expect(service.create({ name: "Books 2", slug: "books" })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
