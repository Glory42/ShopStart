import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "./index";
import { mockFetch, authMeHandler } from "../../test-fetch";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, className, to }: { children: React.ReactNode; className?: string; to: string }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

const UsersPage = Route.options.component as React.ComponentType;

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "shopper@shopstart.dev",
    username: "shopper1",
    phone: null,
    role: "USER",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderUsersPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>,
  );
}

describe("Admin UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders each user's username, email, and role", async () => {
    mockFetch([
      authMeHandler(),
      {
        method: "GET",
        urlIncludes: "/users",
        response: () =>
          new Response(
            JSON.stringify([makeUser(), makeUser({ id: "user-2", username: "admin2", email: "admin2@shopstart.dev", role: "ADMIN" })]),
            { status: 200 },
          ),
      },
    ]);

    renderUsersPage();

    await waitFor(() => expect(screen.getByText("shopper1")).toBeInTheDocument());
    expect(screen.getByText("shopper@shopstart.dev")).toBeInTheDocument();
    expect(screen.getAllByText("USER")).toHaveLength(1);

    expect(screen.getByText("admin2")).toBeInTheDocument();
    expect(screen.getByText("admin2@shopstart.dev")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("renders an empty table body when there are no users", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/users", response: () => new Response(JSON.stringify([]), { status: 200 }) },
    ]);

    renderUsersPage();

    await waitFor(() => expect(screen.getByText("Users")).toBeInTheDocument());
    expect(screen.queryAllByRole("row")).toHaveLength(1); // header row only
  });
});
