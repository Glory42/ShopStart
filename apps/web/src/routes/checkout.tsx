import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Address, CreateAddressInput, Order } from "@shopstart/types";
import { api } from "../lib/api-client";

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

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>

      <h2 className="mb-2 text-sm font-medium text-neutral-500">Shipping address</h2>
      <div className="space-y-2">
        {addresses?.map((address) => (
          <label
            key={address.id}
            className="flex items-start gap-2 rounded-md border border-neutral-300 p-3"
          >
            <input
              type="radio"
              name="address"
              checked={selectedAddressId === address.id}
              onChange={() => setSelectedAddressId(address.id)}
            />
            <span className="text-sm">
              {address.line1}, {address.city}, {address.state} {address.postalCode}
            </span>
          </label>
        ))}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 text-sm text-neutral-600 underline"
        >
          Add a new address
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAddress.mutate(newAddress);
          }}
          className="mt-3 space-y-2"
        >
          {(["line1", "city", "state", "postalCode", "country"] as const).map((field) => (
            <input
              key={field}
              required
              placeholder={field}
              value={newAddress[field] ?? ""}
              onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          ))}
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
          >
            Save address
          </button>
        </form>
      )}

      <button
        onClick={() => placeOrder.mutate()}
        disabled={!selectedAddressId || placeOrder.isPending}
        className="mt-8 w-full rounded-md bg-neutral-900 px-6 py-3 text-white disabled:opacity-50"
      >
        Place order
      </button>
      {placeOrder.isError && (
        <p className="mt-2 text-sm text-red-600">
          {(placeOrder.error as Error).message}
        </p>
      )}
    </div>
  );
}
