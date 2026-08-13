import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "./login";

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

describe("LoginPage", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("submits the entered email/password to /auth/login", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1", email: "customer@shopstart.dev" }), {
        status: 200,
      }),
    );

    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText("Email"), "customer@shopstart.dev");
    await userEvent.type(screen.getByPlaceholderText("Password"), "hunter22");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: "/" }));

    const [, requestInit] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(requestInit.body)).toEqual({
      email: "customer@shopstart.dev",
      password: "hunter22",
    });
  });

  it("shows the server's error message on failed login instead of navigating", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401 }),
    );

    renderLoginPage();

    await userEvent.type(screen.getByPlaceholderText("Email"), "customer@shopstart.dev");
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
