import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { ORDER_STATUS_TRANSITIONS, type CheckoutInput, type OrderStatus } from "@shopstart/types";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { decimalToNumber } from "../../common/decimal";
import { CartService } from "../cart/cart.service";
import { AddressesService } from "../addresses/addresses.service";

const ORDER_INCLUDE = { items: true, payment: true } as const;
type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly addresses: AddressesService,
  ) {}

  private serialize(order: OrderWithRelations) {
    return {
      ...order,
      totalPrice: decimalToNumber(order.totalPrice),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: decimalToNumber(item.unitPrice),
      })),
      payment: order.payment
        ? { ...order.payment, amount: decimalToNumber(order.payment.amount) }
        : null,
    };
  }

  /**
   * Converts the user's Cart into an immutable Order: snapshots current
   * product prices/names into OrderItems, decrements stock transactionally
   * to prevent overselling under concurrent checkouts, and clears the cart.
   */
  async checkout(userId: string, input: CheckoutInput) {
    const address = await this.addresses.requireOwned(userId, input.shippingAddressId);
    const cart = await this.cart.requireNonEmpty(userId);

    const order = await this.prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const itemsData: {
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
      }[] = [];

      for (const item of cart.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (result.count !== 1) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.product.name}`,
          );
        }

        const unitPrice = decimalToNumber(item.product.price);
        totalPrice += unitPrice * item.quantity;
        itemsData.push({
          productId: item.productId,
          productName: item.product.name,
          unitPrice,
          quantity: item.quantity,
        });
      }

      const created = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          totalPrice,
          shippingLine1: address.line1,
          shippingLine2: address.line2,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPostalCode: address.postalCode,
          shippingCountry: address.country,
          items: { create: itemsData },
        },
        include: ORDER_INCLUDE,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return this.serialize(order);
  }

  async findForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => this.serialize(order));
  }

  findAllAdmin() {
    return this.prisma.order
      .findMany({ include: ORDER_INCLUDE, orderBy: { createdAt: "desc" } })
      .then((orders) => orders.map((order) => this.serialize(order)));
  }

  async findById(userId: string, orderId: string, isAdmin: boolean) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException("Order not found");
    if (!isAdmin && order.userId !== userId) throw new ForbiddenException();
    return this.serialize(order);
  }

  async updateStatus(orderId: string, nextStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");

    this.assertValidTransition(order.status as OrderStatus, nextStatus);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
      include: ORDER_INCLUDE,
    });
    return this.serialize(updated);
  }

  /**
   * The same transition guard as updateStatus, but taking a Prisma
   * transaction client so callers that need the status write to
   * participate in their own transaction (e.g. PaymentsService writing a
   * Payment row alongside the Order update) don't have to write
   * Order.status directly and bypass the guard.
   */
  async transitionStatus(
    tx: Prisma.TransactionClient,
    orderId: string,
    nextStatus: OrderStatus,
  ) {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");

    this.assertValidTransition(order.status as OrderStatus, nextStatus);

    await tx.order.update({ where: { id: orderId }, data: { status: nextStatus } });
  }

  private assertValidTransition(current: OrderStatus, next: OrderStatus) {
    const allowed = ORDER_STATUS_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Cannot transition order from ${current} to ${next}`);
    }
  }
}
