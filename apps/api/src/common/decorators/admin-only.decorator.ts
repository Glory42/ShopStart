import { applyDecorators, UseGuards } from "@nestjs/common";
import { Role } from "@shopstart/types";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "../guards/roles.guard";

/**
 * Combines `@UseGuards(RolesGuard)` and `@Roles(Role.ADMIN)` into a single
 * decorator for routes that should only be reachable by admins.
 */
export function AdminOnly() {
  return applyDecorators(UseGuards(RolesGuard), Roles(Role.ADMIN));
}
