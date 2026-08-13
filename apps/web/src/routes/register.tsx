import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { RegisterInput, User } from "@shopstart/types";
import { api } from "../lib/api-client";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RegisterInput>({
    email: "",
    username: "",
    password: "",
  });

  const register = useMutation({
    mutationFn: () => api.post<User>("/auth/register", form),
    onSuccess: (user) => {
      queryClient.setQueryData(["session"], user);
      navigate({ to: "/" });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        register.mutate();
      }}
      className="mx-auto max-w-sm space-y-3"
    >
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <input
        placeholder="Username"
        required
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <input
        type="email"
        placeholder="Email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <input
        type="password"
        placeholder="Password"
        required
        minLength={8}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full rounded border border-neutral-300 px-3 py-2"
      />
      <button
        type="submit"
        disabled={register.isPending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-white"
      >
        Create account
      </button>
      {register.isError && (
        <p className="text-sm text-red-600">{(register.error as Error).message}</p>
      )}
    </form>
  );
}
