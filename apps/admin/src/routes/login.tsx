import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { LoginInput, User } from "@shopstart/types";
import { api, ApiError } from "../lib/api-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LoginInput>({ email: "", password: "" });

  const login = useMutation({
    mutationFn: async () => {
      const user = await api.post<User>("/auth/login", form);
      if (user.role !== "ADMIN") {
        await api.post("/auth/logout");
        throw new ApiError(403, "This account does not have admin access");
      }
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["session"], user);
      navigate({ to: "/" });
    },
  });

  return (
    <div className="mx-auto max-w-sm py-16">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
        className="space-y-3"
      >
        <h1 className="text-2xl font-semibold">shopstart admin</h1>
        <input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded border border-neutral-300 px-3 py-2"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded border border-neutral-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-white"
        >
          Log in
        </button>
        {login.isError && (
          <p className="text-sm text-red-600">{(login.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
