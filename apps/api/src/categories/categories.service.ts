import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateCategoryInput, UpdateCategoryInput } from "@shopstart/types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async create(input: CreateCategoryInput) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: input.slug },
    });
    if (existing) throw new ConflictException("Slug already in use");
    return this.prisma.category.create({ data: input });
  }

  async update(id: string, input: UpdateCategoryInput) {
    await this.findById(id);
    return this.prisma.category.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.category.delete({ where: { id } });
  }
}
