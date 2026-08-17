import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "./index";
import { mockFetch, adminUser, authMeHandler } from "../test-fetch";

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

const DashboardPage = Route.options.component as React.ComponentType;

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

describe("Admin DashboardPage", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it("welcomes the authenticated admin by username and links to every management screen", async () => {
    mockFetch([authMeHandler(adminUser)]);

    renderDashboard();

    await waitFor(() => expect(screen.getByText("Welcome, admin")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "Categories" })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/users");
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("renders nothing while the session is still loading", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    const { container } = renderDashboard();

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing and defers to useRequireAdmin's redirect for a signed-out session", async () => {
    mockFetch([
      {
        method: "GET",
        urlIncludes: "/auth/me",
        response: () => new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
      },
    ]);

    const { container } = renderDashboard();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: "/login" }));
    expect(container).toBeEmptyDOMElement();
  });
});
