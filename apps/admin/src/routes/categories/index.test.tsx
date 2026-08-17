import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const CategoriesPage = Route.options.component as React.ComponentType;

const categoryId = "11111111-1111-4111-8111-111111111111";

function makeCategory(overrides: Record<string, unknown> = {}) {
  return { id: categoryId, name: "Apparel", slug: "apparel", ...overrides };
}

function renderCategoriesPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoriesPage />
    </QueryClientProvider>,
  );
}

describe("Admin CategoriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders each category's name and slug", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify([makeCategory()]), { status: 200 }) },
    ]);

    renderCategoriesPage();

    await waitFor(() => expect(screen.getByText("Apparel")).toBeInTheDocument());
    expect(screen.getByText("/apparel")).toBeInTheDocument();
  });

  it("submits name/slug to POST /categories and resets the form on success", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify([]), { status: 200 }) },
      { method: "POST", urlIncludes: "/categories", response: () => new Response(JSON.stringify(makeCategory()), { status: 201 }) },
    ]);

    renderCategoriesPage();

    await screen.findByPlaceholderText("Name");
    await userEvent.type(screen.getByPlaceholderText("Name"), "Outdoors");
    await userEvent.type(screen.getByPlaceholderText("Slug"), "outdoors");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    const postCall = await waitFor(() => {
      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (args: unknown[]) => (args[0] as string).includes("/categories") && (args[1] as RequestInit)?.method === "POST",
      );
      if (!call) throw new Error("not called yet");
      return call as [string, RequestInit];
    });
    expect(JSON.parse(postCall[1].body as string)).toEqual({ name: "Outdoors", slug: "outdoors" });

    await waitFor(() => expect(screen.getByPlaceholderText("Name")).toHaveValue(""));
  });

  it("deletes a category via DELETE /categories/:id when Delete is clicked", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify([makeCategory()]), { status: 200 }) },
      { method: "DELETE", urlIncludes: `/categories/${categoryId}`, response: () => new Response(null, { status: 204 }) },
    ]);

    renderCategoriesPage();

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(
        (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
          (args: unknown[]) =>
            (args[0] as string).includes(`/categories/${categoryId}`) && (args[1] as RequestInit)?.method === "DELETE",
        ),
      ).toBe(true),
    );
  });

  it("requires both name and slug before the browser allows submission", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify([]), { status: 200 }) },
    ]);

    renderCategoriesPage();

    await screen.findByPlaceholderText("Name");
    expect(screen.getByPlaceholderText("Name")).toBeRequired();
    expect(screen.getByPlaceholderText("Slug")).toBeRequired();
  });
});
