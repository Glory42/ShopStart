import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "./register";

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

const RegisterPage = Route.options.component as React.ComponentType;

function renderRegisterPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RegisterPage />
    </QueryClientProvider>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("submits username/email/password to /auth/register", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1", email: "new@shopstart.dev" }), { status: 201 }),
    );

    renderRegisterPage();

    await userEvent.type(screen.getByPlaceholderText("Username"), "newcustomer");
    await userEvent.type(screen.getByPlaceholderText("Email"), "new@shopstart.dev");
    await userEvent.type(screen.getByPlaceholderText("Password"), "hunter22");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: "/" }));

    const [, requestInit] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(requestInit.body)).toEqual({
      username: "newcustomer",
      email: "new@shopstart.dev",
      password: "hunter22",
    });
  });

  it("shows the server's error (e.g. duplicate email) instead of navigating", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ message: "Email or username already in use" }), {
        status: 409,
      }),
    );

    renderRegisterPage();

    await userEvent.type(screen.getByPlaceholderText("Username"), "customer");
    await userEvent.type(screen.getByPlaceholderText("Email"), "customer@shopstart.dev");
    await userEvent.type(screen.getByPlaceholderText("Password"), "hunter22");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByText("Email or username already in use")).toBeInTheDocument(),
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("requires the password to be at least 8 characters", () => {
    renderRegisterPage();
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("minLength", "8");
  });
});
