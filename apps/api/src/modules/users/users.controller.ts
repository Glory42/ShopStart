import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { updateUserSchema, Role, type UpdateUserInput } from "@shopstart/types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AdminOnly } from "../../common/decorators/admin-only.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.users.findById(user.id);
  }

  @Patch("me")
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateUserSchema)) input: UpdateUserInput,
  ) {
    return this.users.update(user.id, input);
  }

  @Get()
  @AdminOnly()
  findAll() {
    return this.users.findAll();
  }

  @Get(":id")
  @AdminOnly()
  findOne(@Param("id") id: string) {
    return this.users.findById(id);
  }
}
