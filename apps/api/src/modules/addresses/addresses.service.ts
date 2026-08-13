import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateAddressInput } from "@shopstart/types";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  create(userId: string, input: CreateAddressInput) {
    return this.prisma.address.create({ data: { ...input, userId } });
  }

  async remove(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException("Address not found");
    if (address.userId !== userId) throw new ForbiddenException();
    await this.prisma.address.delete({ where: { id: addressId } });
  }

  /** Used internally by OrdersService to snapshot the address at checkout. */
  async requireOwned(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException("Address not found");
    if (address.userId !== userId) throw new ForbiddenException();
    return address;
  }
}
