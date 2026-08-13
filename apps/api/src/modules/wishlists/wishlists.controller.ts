import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  addToWishlistSchema,
  createWishlistSchema,
  type AddToWishlistInput,
  type CreateWishlistInput,
} from "@shopstart/types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { WishlistsService } from "./wishlists.service";

@ApiTags("wishlists")
@Controller("wishlists")
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlists: WishlistsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlists.listForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createWishlistSchema)) input: CreateWishlistInput,
  ) {
    return this.wishlists.create(user.id, input);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.wishlists.remove(user.id, id);
  }

  @Post(":id/items")
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addToWishlistSchema)) input: AddToWishlistInput,
  ) {
    return this.wishlists.addItem(user.id, id, input);
  }

  @Delete(":id/items/:productId")
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("productId") productId: string,
  ) {
    return this.wishlists.removeItem(user.id, id, productId);
  }
}
