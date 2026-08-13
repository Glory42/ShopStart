import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  createCategorySchema,
  updateCategorySchema,
  Role,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@shopstart/types";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CategoriesService } from "./categories.service";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.categories.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body(new ZodValidationPipe(createCategorySchema)) input: CreateCategoryInput) {
    return this.categories.create(input);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) input: UpdateCategoryInput,
  ) {
    return this.categories.update(id, input);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.categories.remove(id);
  }
}
