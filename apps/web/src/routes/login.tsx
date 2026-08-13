import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { LoginInput, User } from "@shopstart/types";
import { api } from "../lib/api-client";
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
    mutationFn: () => api.post<User>("/auth/login", form),
    onSuccess: (user) => {
      queryClient.setQueryData(["session"], user);
      navigate({ to: "/" });
    },
  });

  return (
    <div className="mx-auto max-w-sm px-5 py-24">
      <p className="eyebrow mb-3 text-center">Welcome back</p>
      <h1 className="text-center text-3xl font-semibold tracking-tight text-ink">
        Log in
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
        className="mt-9 space-y-3"
      >
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
        <Button type="submit" variant="dark" disabled={login.isPending} className="w-full">
          Log in
        </Button>
        {login.isError && (
          <p className="text-[13px] text-danger">{(login.error as Error).message}</p>
        )}
      </form>
      <p className="mt-6 text-center text-[14px] text-graphite">
        No account?{" "}
        <Link to="/register" className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
