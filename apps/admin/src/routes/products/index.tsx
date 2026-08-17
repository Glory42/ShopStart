import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Category, CreateProductInput, Product } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { useRequireAdmin } from "../../lib/session";
import { Button } from "../../components/button";
import { Input, Select } from "../../components/input";
import { Table, TableBody, TableHead, TableRow } from "../../components/table";

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
        <Input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          type="number"
          step="0.01"
          required
          placeholder="Price"
          value={form.price || ""}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />
        <Input
          type="number"
          required
          placeholder="Stock"
          value={form.stockQuantity || ""}
          onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
        />
        <Select
          required
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">Category...</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Image URL"
          value={form.imageUrl ?? ""}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
        <Button>Add product</Button>
      </form>

      <Table>
        <TableHead columns={["Name", "Price", "Stock", ""]} />
        <TableBody>
          {products?.items.map((product) => (
            <TableRow
              key={product.id}
              cells={[
                product.name,
                `$${product.price.toFixed(2)}`,
                product.stockQuantity,
                <Button variant="danger" onClick={() => removeProduct.mutate(product.id)}>
                  Delete
                </Button>,
              ]}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
