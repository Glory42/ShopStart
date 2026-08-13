import { Injectable, NotFoundException } from "@nestjs/common";
import type { UpdateUserInput } from "@shopstart/types";
import { PrismaService } from "../prisma/prisma.service";

const PUBLIC_FIELDS = {
  id: true,
  email: true,
  username: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_FIELDS,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  findAll() {
    return this.prisma.user.findMany({ select: PUBLIC_FIELDS });
  }

  async update(id: string, input: UpdateUserInput) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: input,
      select: PUBLIC_FIELDS,
    });
  }
}
