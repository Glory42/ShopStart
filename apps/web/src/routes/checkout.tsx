import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Address, CreateAddressInput, Order } from "@shopstart/types";
import { api } from "../lib/api-client";
import { cartTotal, useCartQuery } from "../lib/use-cart";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const emptyAddress: CreateAddressInput = {
  line1: "",
  line2: null,
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: addresses } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => api.get<Address[]>("/addresses"),
  });
  const { data: cart } = useCartQuery();

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);

  const createAddress = useMutation({
    mutationFn: (input: CreateAddressInput) => api.post<Address>("/addresses", input),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelectedAddressId(address.id);
      setShowForm(false);
    },
  });

  const placeOrder = useMutation({
    mutationFn: () =>
      api.post<Order>("/orders/checkout", { shippingAddressId: selectedAddressId }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate({ to: "/account/orders", search: { placedOrderId: order.id } as never });
    },
  });

  const total = cartTotal(cart);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="mb-10 text-4xl font-semibold tracking-tight text-ink">Checkout</h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="eyebrow mb-4">Shipping address</p>
          <div className="space-y-3">
            {addresses?.map((address) => (
              <label
                key={address.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                  selectedAddressId === address.id
                    ? "border-ink"
                    : "border-hairline hover:border-graphite",
                )}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                  className="mt-1 accent-accent"
                />
                <span className="text-[14px] text-ink">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                  {address.state} {address.postalCode}
                </span>
              </label>
            ))}
          </div>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-[14px] font-medium text-accent hover:underline"
            >
              + Add a new address
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAddress.mutate(newAddress);
              }}
              className="mt-4 space-y-3 rounded-2xl border border-hairline p-5"
            >
              {(
                [
                  ["line1", "Address line 1"],
                  ["city", "City"],
                  ["state", "State"],
                  ["postalCode", "ZIP code"],
                  ["country", "Country (2-letter code)"],
                ] as const
              ).map(([field, label]) => (
                <Input
                  key={field}
                  required
                  placeholder={label}
                  value={newAddress[field] ?? ""}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, [field]: e.target.value })
                  }
                />
              ))}
              <Button type="submit" variant="invert">
                Save address
              </Button>
            </form>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-hairline p-6 lg:sticky lg:top-20">
          <p className="eyebrow mb-4">Order summary</p>
          <ul className="space-y-3">
            {cart?.items.map((item) => (
              <li key={item.id} className="flex justify-between text-[14px]">
                <span className="text-graphite">
                  {item.product?.name} × {item.quantity}
                </span>
                <span className="text-ink">
                  ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4 text-[15px] font-medium text-ink">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Button
            variant="primary"
            className="mt-6 w-full"
            onClick={() => placeOrder.mutate()}
            disabled={!selectedAddressId || placeOrder.isPending}
          >
            Place order
          </Button>
          {placeOrder.isError && (
            <p className="mt-3 text-[13px] text-danger">
              {(placeOrder.error as Error).message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
