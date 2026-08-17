import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "./login";
import { mockFetch } from "../test-fetch";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ children, className, to }: { children: React.ReactNode; className?: string; to: string }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

const LoginPage = Route.options.component as React.ComponentType;

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>,
  );
}

describe("Admin LoginPage", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("submits the entered email/password to /auth/login and navigates home for an admin", async () => {
    mockFetch([
      {
        method: "POST",
        urlIncludes: "/auth/login",
        response: () =>
          new Response(JSON.stringify({ id: "user-1", email: "admin@shopstart.dev", role: "ADMIN" }), {
            status: 200,
          }),
      },
    ]);

    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText("Email"), "admin@shopstart.dev");
    await userEvent.type(screen.getByPlaceholderText("Password"), "hunter22");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: "/" }));

    const [, requestInit] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(requestInit.body)).toEqual({
      email: "admin@shopstart.dev",
      password: "hunter22",
    });
  });

  it("logs out and shows an access-denied error instead of navigating when the account is not an admin", async () => {
    mockFetch([
      {
        method: "POST",
        urlIncludes: "/auth/login",
        response: () =>
          new Response(JSON.stringify({ id: "user-2", email: "shopper@shopstart.dev", role: "USER" }), {
            status: 200,
          }),
      },
      {
        method: "POST",
        urlIncludes: "/auth/logout",
        response: () => new Response(null, { status: 204 }),
      },
    ]);

    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText("Email"), "shopper@shopstart.dev");
    await userEvent.type(screen.getByPlaceholderText("Password"), "hunter22");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(screen.getByText("This account does not have admin access")).toBeInTheDocument(),
    );
    expect(navigateMock).not.toHaveBeenCalled();
    expect(
      (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
        (args: unknown[]) => (args[0] as string).includes("/auth/logout") && (args[1] as RequestInit).method === "POST",
      ),
    ).toBe(true);
  });

  it("shows the server's error message on failed login instead of navigating", async () => {
    mockFetch([
      {
        method: "POST",
        urlIncludes: "/auth/login",
        response: () => new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401 }),
      },
    ]);

    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText("Email"), "admin@shopstart.dev");
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(screen.getByText("Invalid credentials")).toBeInTheDocument());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("requires both fields before the browser allows submission", () => {
    renderLoginPage();

    expect(screen.getByPlaceholderText("Email")).toBeRequired();
    expect(screen.getByPlaceholderText("Password")).toBeRequired();
  });
});
