import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { LoginInput, User } from "@shopstart/types";
import { api, ApiError } from "../lib/api-client";
import { Button } from "../components/button";
import { Input } from "../components/input";

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
        <Input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          type="password"
          required
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" disabled={login.isPending} className="w-full">
          Log in
        </Button>
        {login.isError && (
          <p className="text-sm text-red-600">{(login.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
