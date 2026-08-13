import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  addToCartSchema,
  updateCartItemSchema,
  type AddToCartInput,
  type UpdateCartItemInput,
} from "@shopstart/types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CartService } from "./cart.service";

@ApiTags("cart")
@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.cart.getOrCreate(user.id);
  }

  @Post("items")
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(addToCartSchema)) input: AddToCartInput,
  ) {
    return this.cart.addItem(user.id, input);
  }

  @Patch("items/:productId")
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId") productId: string,
    @Body(new ZodValidationPipe(updateCartItemSchema)) input: UpdateCartItemInput,
  ) {
    return this.cart.updateItem(user.id, productId, input);
  }

  @Delete("items/:productId")
  removeItem(@CurrentUser() user: AuthenticatedUser, @Param("productId") productId: string) {
    return this.cart.removeItem(user.id, productId);
  }
}
