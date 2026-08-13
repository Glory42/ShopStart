import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createReviewSchema, type CreateReviewInput } from "@shopstart/types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ReviewsService } from "./reviews.service";

@ApiTags("reviews")
@Controller("products/:productId/reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  findForProduct(@Param("productId") productId: string) {
    return this.reviews.findForProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param("productId") productId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createReviewSchema)) input: CreateReviewInput,
  ) {
    return this.reviews.create(productId, user.id, input);
  }
}
