import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  CreateProductInput,
  ProductQuery,
  UpdateProductInput,
} from "@shopstart/types";
import { PrismaService } from "../prisma/prisma.service";
import { decimalToNumber } from "../common/decimal";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize<T extends { price: Prisma.Decimal }>(product: T) {
    return { ...product, price: decimalToNumber(product.price) };
  }

  async findAll(query: ProductQuery) {
    const where: Prisma.ProductWhereInput = {
      categoryId: query.categoryId,
      name: query.q ? { contains: query.q, mode: "insensitive" } : undefined,
      stockQuantity: query.inStock ? { gt: 0 } : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serialize(item)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    return this.serialize(product);
  }

  async create(input: CreateProductInput) {
    const product = await this.prisma.product.create({ data: input });
    return this.serialize(product);
  }

  async update(id: string, input: UpdateProductInput) {
    await this.findById(id);
    const product = await this.prisma.product.update({ where: { id }, data: input });
    return this.serialize(product);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.product.delete({ where: { id } });
  }
}
