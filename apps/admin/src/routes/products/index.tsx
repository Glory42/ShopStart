import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Category, CreateProductInput, Product } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { useRequireAdmin } from "../../lib/session";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});

const emptyForm: CreateProductInput = {
  name: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  imageUrl: "",
  categoryId: "",
};

function ProductsPage() {
  const { isLoading: authLoading, user } = useRequireAdmin();
  const queryClient = useQueryClient();
  const { data: products } = useQuery<{ items: Product[] }>({
    queryKey: ["admin-products"],
    queryFn: () => api.get("/products?pageSize=100"),
  });
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });
  const [form, setForm] = useState(emptyForm);

  const createProduct = useMutation({
    mutationFn: (input: CreateProductInput) => api.post("/products", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setForm(emptyForm);
    },
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  if (authLoading || !user) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Products</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createProduct.mutate(form);
        }}
        className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          step="0.01"
          required
          placeholder="Price"
          value={form.price || ""}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          required
          placeholder="Stock"
          value={form.stockQuantity || ""}
          onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          required
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Category...</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Image URL"
          value={form.imageUrl ?? ""}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">
          Add product
        </button>
      </form>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2">Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products?.items.map((product) => (
            <tr key={product.id} className="border-b border-neutral-100">
              <td className="py-2">{product.name}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>{product.stockQuantity}</td>
              <td>
                <button
                  onClick={() => removeProduct.mutate(product.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
