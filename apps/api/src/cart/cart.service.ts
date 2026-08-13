import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { AddToCartInput, UpdateCartItemInput } from "@shopstart/types";
import { PrismaService } from "../prisma/prisma.service";
import { decimalToNumber } from "../common/decimal";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(cart: Awaited<ReturnType<typeof this.getRaw>>) {
    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map((item) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: item.quantity,
        product: { ...item.product, price: decimalToNumber(item.product.price) },
      })),
    };
  }

  private getRaw(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { items: { include: { product: true } } },
    });
  }

  async getOrCreate(userId: string) {
    return this.serialize(await this.getRaw(userId));
  }

  async addItem(userId: string, input: AddToCartInput) {
    const cart = await this.getRaw(userId);
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) throw new NotFoundException("Product not found");

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
      create: { cartId: cart.id, productId: input.productId, quantity: input.quantity },
      update: { quantity: { increment: input.quantity } },
    });

    return this.getOrCreate(userId);
  }

  async updateItem(userId: string, productId: string, input: UpdateCartItemInput) {
    const cart = await this.getRaw(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException("Item not in cart");

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: input.quantity },
    });
    return this.getOrCreate(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getRaw(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException("Item not in cart");

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getOrCreate(userId);
  }

  async requireNonEmpty(userId: string) {
    const cart = await this.getRaw(userId);
    if (cart.items.length === 0) throw new BadRequestException("Cart is empty");
    return cart;
  }

  clear(cartId: string) {
    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
