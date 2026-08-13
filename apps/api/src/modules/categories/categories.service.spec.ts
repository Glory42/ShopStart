import { Test } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CategoriesService } from "./categories.service";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  it("creates a category when the slug is free", async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue({ id: "1", name: "Books", slug: "books" });

    const result = await service.create({ name: "Books", slug: "books" });

    expect(result.slug).toBe("books");
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: "Books", slug: "books" },
    });
  });

  it("rejects a duplicate slug", async () => {
    prisma.category.findUnique.mockResolvedValue({ id: "1", name: "Books", slug: "books" });

    await expect(service.create({ name: "Books 2", slug: "books" })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
