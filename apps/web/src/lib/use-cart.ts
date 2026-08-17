import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Cart, CartItem } from "@shopstart/types";
import { api } from "./api-client";

/**
 * The cart's order total: the sum of each item's product price × quantity.
 * Single implementation — CartPage and CheckoutPage both call this instead
 * of each independently re-deriving the same reduce.
 */
export function cartTotal(cart: Cart | null | undefined): number {
  return (cart?.items ?? []).reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );
}

/**
 * Clamp a requested quantity to what the server could actually accept: at
 * least 1 (the API schema's floor, `updateCartItemSchema`), and no more than
 * the product's known `stockQuantity`. When stock isn't known (the item's
 * `product` wasn't included on the response) the request passes through
 * unclamped.
 *
 * This is a UI nicety only, not the enforcement point — it stops the cart
 * screen from letting a shopper build a cart the server would reject, but
 * `OrdersService.checkout`'s transactional stock guard remains the real
 * source of truth against races (two tabs, another shopper buying the last
 * unit, etc.).
 */
export function clampQuantity(requested: number, stockQuantity?: number): number {
  const atLeastOne = Math.max(1, requested);
  if (stockQuantity === undefined) return atLeastOne;
  return Math.min(atLeastOne, Math.max(stockQuantity, 1));
}

/** Fetches the signed-in user's cart. Shared query key/fn so every screen
 * that reads the cart (CartPage, CheckoutPage, Nav) stays in sync through
 * react-query's cache. */
export function useCartQuery() {
  return useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => api.get<Cart>("/cart"),
  });
}

/**
 * Add/update/remove mutations for cart items, each invalidating the shared
 * `["cart"]` query on success. Split out from `useCart` so a screen that
 * only needs to mutate (e.g. the product detail page's "Add to bag") isn't
 * forced to also fetch the cart it doesn't render.
 */
export function useCartMutations() {
  const queryClient = useQueryClient();
  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addItem = useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: string; quantity?: number }) =>
      api.post("/cart/items", { productId, quantity }),
    onSuccess: invalidateCart,
  });

  const updateQuantity = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.patch(`/cart/items/${productId}`, { quantity }),
    onSuccess: invalidateCart,
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => api.delete(`/cart/items/${productId}`),
    onSuccess: invalidateCart,
  });

  /** Set an item's quantity, clamped against its known stock (see
   * `clampQuantity`) so increment/decrement controls can't request a
   * quantity the server would refuse. */
  function setQuantity(item: CartItem, requested: number) {
    updateQuantity.mutate({
      productId: item.productId,
      quantity: clampQuantity(requested, item.product?.stockQuantity),
    });
  }

  return { addItem, updateQuantity, removeItem, setQuantity };
}

/**
 * Owns "what is this cart worth" and "how do items in it change": the cart
 * query, its total, and item mutations, in one place for screens (CartPage)
 * that need all three. Screens that only read the cart (CheckoutPage) can
 * use `useCartQuery` + `cartTotal` directly instead of pulling in mutations
 * they never call.
 */
export function useCart() {
  const query = useCartQuery();
  const mutations = useCartMutations();

  return {
    ...query,
    cart: query.data,
    total: cartTotal(query.data),
    ...mutations,
  };
}
