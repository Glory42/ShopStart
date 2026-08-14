import { Test } from "@nestjs/testing";
import { WishlistsController } from "./wishlists.controller";
import { WishlistsService } from "./wishlists.service";

describe("WishlistsController", () => {
  let controller: WishlistsController;
  let wishlists: {
    listForUser: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
    addItem: jest.Mock;
    removeItem: jest.Mock;
  };

  const user = { id: "user-1", email: "a@b.test", role: "CUSTOMER" } as never;
  const wishlistId = "wishlist-1";
  const productId = "product-1";

  beforeEach(async () => {
    wishlists = {
      listForUser: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [WishlistsController],
      providers: [{ provide: WishlistsService, useValue: wishlists }],
    }).compile();

    controller = module.get(WishlistsController);
  });

  // Every route takes the user id from the authenticated principal rather than
  // from the request body or a path param. That is the property worth pinning:
  // a route that took an owner id from user input would be an access-control
  // bug that the service layer could not catch.

  it("lists using the authenticated user's id", () => {
    controller.list(user);

    expect(wishlists.listForUser).toHaveBeenCalledWith("user-1");
  });

  it("creates using the authenticated user's id", () => {
    const input = { name: "Birthday" };

    controller.create(user, input);

    expect(wishlists.create).toHaveBeenCalledWith("user-1", input);
  });

  it("removes using the authenticated user's id and the path id", () => {
    controller.remove(user, wishlistId);

    expect(wishlists.remove).toHaveBeenCalledWith("user-1", wishlistId);
  });

  it("adds an item using the authenticated user's id", () => {
    const input = { productId };

    controller.addItem(user, wishlistId, input);

    expect(wishlists.addItem).toHaveBeenCalledWith("user-1", wishlistId, input);
  });

  it("removes an item using the authenticated user's id", () => {
    controller.removeItem(user, wishlistId, productId);

    expect(wishlists.removeItem).toHaveBeenCalledWith("user-1", wishlistId, productId);
  });

  it("returns whatever the service returns, unwrapped", () => {
    const lists = [{ id: wishlistId, name: "Birthday" }];
    wishlists.listForUser.mockReturnValue(lists);

    expect(controller.list(user)).toBe(lists);
  });
});
