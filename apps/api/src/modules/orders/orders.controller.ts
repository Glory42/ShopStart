import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  checkoutSchema,
  updateOrderStatusSchema,
  Role,
  type CheckoutInput,
  type UpdateOrderStatusInput,
} from "@shopstart/types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AdminOnly } from "../../common/decorators/admin-only.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post("checkout")
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(checkoutSchema)) input: CheckoutInput,
  ) {
    return this.orders.checkout(user.id, input);
  }

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.findForUser(user.id);
  }

  @Get("admin")
  @AdminOnly()
  findAllAdmin() {
    return this.orders.findAllAdmin();
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.orders.findById(user.id, id, user.role === Role.ADMIN);
  }

  @Patch(":id/status")
  @AdminOnly()
  updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) input: UpdateOrderStatusInput,
  ) {
    return this.orders.updateStatus(id, input.status);
  }
}
