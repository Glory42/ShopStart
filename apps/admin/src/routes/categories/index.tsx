import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Category, CreateCategoryInput } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { useRequireAdmin } from "../../lib/session";

export const Route = createFileRoute("/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { isLoading: authLoading, user } = useRequireAdmin();
  const queryClient = useQueryClient();
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });
  const [form, setForm] = useState<CreateCategoryInput>({ name: "", slug: "" });

  const createCategory = useMutation({
    mutationFn: (input: CreateCategoryInput) => api.post("/categories", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm({ name: "", slug: "" });
    },
  });

  const removeCategory = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  if (authLoading || !user) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Categories</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createCategory.mutate(form);
        }}
        className="mb-6 flex gap-2"
      >
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">
          Add
        </button>
      </form>

      <ul className="divide-y divide-neutral-200">
        {categories?.map((category) => (
          <li key={category.id} className="flex items-center justify-between py-3">
            <span>
              {category.name} <span className="text-neutral-400">/{category.slug}</span>
            </span>
            <button
              onClick={() => removeCategory.mutate(category.id)}
              className="text-sm text-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
