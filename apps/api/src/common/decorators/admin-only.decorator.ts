import { UseGuards, applyDecorators } from "@nestjs/common";
import { Role } from "@shopstart/types";

import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "./roles.decorator";

/**
 * Restrict a route to admins.
 *
 * Replaces the `@UseGuards(RolesGuard)` + `@Roles(Role.ADMIN)` pair that every
 * admin route otherwise repeats.
 *
 * **Requires authentication to already be applied.** `RolesGuard` reads
 * `request.user`, which only exists once `JwtAuthGuard` has run, so this is
 * only safe on a controller carrying a class-level `@UseGuards(JwtAuthGuard)` —
 * as `OrdersController` and `UsersController` do.
 *
 * On a controller without that (today: `CategoriesController`,
 * `ProductsController`, `ReviewsController`, which spell out
 * `@UseGuards(JwtAuthGuard, RolesGuard)` per route), swapping in `AdminOnly()`
 * would drop `JwtAuthGuard` and leave the route unauthenticated. Add the
 * class-level guard first, or keep the explicit pair there.
 */
export function AdminOnly() {
  return applyDecorators(UseGuards(RolesGuard), Roles(Role.ADMIN));
}
