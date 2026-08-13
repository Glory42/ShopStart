import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
  Role,
  type CreateProductInput,
  type ProductQuery,
  type UpdateProductInput,
} from "@shopstart/types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Query(new ZodValidationPipe(productQuerySchema)) query: ProductQuery) {
    return this.products.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.products.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body(new ZodValidationPipe(createProductSchema)) input: CreateProductInput) {
    return this.products.create(input);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) input: UpdateProductInput,
  ) {
    return this.products.update(id, input);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.products.remove(id);
  }
}
