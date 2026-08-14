import { UseGuards } from "@nestjs/common";
import { Role } from "@shopstart/types";

import { AdminOnly } from "./admin-only.decorator";
import { ROLES_KEY, Roles } from "./roles.decorator";
import { RolesGuard } from "../guards/roles.guard";
import { OrdersController } from "../../modules/orders/orders.controller";
import { UsersController } from "../../modules/users/users.controller";

/** How Nest stores `@UseGuards(...)` on a handler. */
const GUARDS_METADATA = "__guards__";

function guardsOn(target: object, method: string) {
  return (Reflect.getMetadata(GUARDS_METADATA, (target as never)[method]) ?? []) as unknown[];
}

function rolesOn(target: object, method: string) {
  return Reflect.getMetadata(ROLES_KEY, (target as never)[method]) as unknown;
}

class OldWay {
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  handler() {}
}

class NewWay {
  @AdminOnly()
  handler() {}
}

describe("AdminOnly", () => {
  it("attaches RolesGuard", () => {
    expect(guardsOn(NewWay.prototype, "handler")).toContain(RolesGuard);
  });

  it("attaches the ADMIN role metadata", () => {
    expect(rolesOn(NewWay.prototype, "handler")).toEqual([Role.ADMIN]);
  });

  it("is equivalent to the guard/roles pair it replaces", () => {
    // The point of the refactor: same guards, same metadata, one line.
    expect(guardsOn(NewWay.prototype, "handler")).toEqual(guardsOn(OldWay.prototype, "handler"));
    expect(rolesOn(NewWay.prototype, "handler")).toEqual(rolesOn(OldWay.prototype, "handler"));
  });

  it("does not attach guards to an undecorated handler", () => {
    class Plain {
      handler() {}
    }

    expect(guardsOn(Plain.prototype, "handler")).toEqual([]);
    expect(rolesOn(Plain.prototype, "handler")).toBeUndefined();
  });
});

describe("migrated admin routes", () => {
  it.each([
    [OrdersController, "findAllAdmin"],
    [OrdersController, "updateStatus"],
    [UsersController, "findAll"],
    [UsersController, "findOne"],
  ])("%p.%s stays admin-only", (controller, method) => {
    expect(guardsOn(controller.prototype, method)).toContain(RolesGuard);
    expect(rolesOn(controller.prototype, method)).toEqual([Role.ADMIN]);
  });
});
