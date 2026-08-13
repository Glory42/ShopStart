import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { RegisterInput, User } from "@shopstart/types";
import { api } from "../lib/api-client";
import { Button } from "../components/button";
import { Input } from "../components/input";

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
    <div className="mx-auto max-w-sm px-5 py-24">
      <p className="eyebrow mb-3 text-center">Get started</p>
      <h1 className="text-center text-3xl font-semibold tracking-tight text-ink">
        Create an account
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          register.mutate();
        }}
        className="mt-9 space-y-3"
      >
        <Input
          placeholder="Username"
          required
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <Input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          type="password"
          placeholder="Password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button
          type="submit"
          variant="invert"
          disabled={register.isPending}
          className="w-full"
        >
          Create account
        </Button>
        {register.isError && (
          <p className="text-[13px] text-danger">{(register.error as Error).message}</p>
        )}
      </form>
      <p className="mt-6 text-center text-[14px] text-graphite">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
