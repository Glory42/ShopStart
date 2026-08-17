import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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

const ProductsPage = Route.options.component as React.ComponentType;

const apparelId = "11111111-1111-4111-8111-111111111111";
const outdoorsId = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";

const categories = [
  { id: apparelId, name: "Apparel", slug: "apparel" },
  { id: outdoorsId, name: "Outdoors", slug: "outdoors" },
];

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: productId,
    name: "Everyday Crew Tee",
    description: null,
    price: 24,
    stockQuantity: 10,
    imageUrl: null,
    categoryId: apparelId,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderProductsPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductsPage />
    </QueryClientProvider>,
  );
}

describe("Admin ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders every product with its price and stock", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      {
        method: "GET",
        urlIncludes: "/products",
        response: () => new Response(JSON.stringify({ items: [makeProduct()] }), { status: 200 }),
      },
    ]);

    renderProductsPage();

    await waitFor(() => expect(screen.getByText("Everyday Crew Tee")).toBeInTheDocument());
    expect(screen.getByText("$24.00")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("populates the category select with every category, plus a placeholder", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: [] }), { status: 200 }) },
    ]);

    renderProductsPage();

    const select = await screen.findByRole("combobox");
    expect(within(select).getByRole("option", { name: "Category..." })).toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "Apparel" })).toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "Outdoors" })).toBeInTheDocument();
  });

  it("submits the form as a CreateProductInput to POST /products and resets the form on success", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: [] }), { status: 200 }) },
      { method: "POST", urlIncludes: "/products", response: () => new Response(JSON.stringify(makeProduct()), { status: 201 }) },
    ]);

    renderProductsPage();

    await screen.findByRole("combobox");
    await userEvent.type(screen.getByPlaceholderText("Name"), "Trail Runner Jacket");
    await userEvent.type(screen.getByPlaceholderText("Price"), "90");
    await userEvent.type(screen.getByPlaceholderText("Stock"), "15");
    await userEvent.selectOptions(screen.getByRole("combobox"), "Outdoors");
    await userEvent.type(screen.getByPlaceholderText("Image URL"), "https://placehold.co/600x600");
    await userEvent.click(screen.getByRole("button", { name: "Add product" }));

    const postCall = await waitFor(() => {
      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (args: unknown[]) => (args[0] as string).includes("/products") && (args[1] as RequestInit)?.method === "POST",
      );
      if (!call) throw new Error("not called yet");
      return call as [string, RequestInit];
    });
    expect(JSON.parse(postCall[1].body as string)).toEqual({
      name: "Trail Runner Jacket",
      description: "",
      price: 90,
      stockQuantity: 15,
      categoryId: outdoorsId,
      imageUrl: "https://placehold.co/600x600",
    });

    await waitFor(() => expect(screen.getByPlaceholderText("Name")).toHaveValue(""));
  });

  it("deletes a product via DELETE /products/:id when Delete is clicked", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      {
        method: "GET",
        urlIncludes: "/products",
        response: () => new Response(JSON.stringify({ items: [makeProduct()] }), { status: 200 }),
      },
      { method: "DELETE", urlIncludes: `/products/${productId}`, response: () => new Response(null, { status: 204 }) },
    ]);

    renderProductsPage();

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(
        (fetch as ReturnType<typeof vi.fn>).mock.calls.some(
          (args: unknown[]) =>
            (args[0] as string).includes(`/products/${productId}`) && (args[1] as RequestInit)?.method === "DELETE",
        ),
      ).toBe(true),
    );
  });

  it("requires name, price, stock, and category before the browser allows submission", async () => {
    mockFetch([
      authMeHandler(),
      { method: "GET", urlIncludes: "/categories", response: () => new Response(JSON.stringify(categories), { status: 200 }) },
      { method: "GET", urlIncludes: "/products", response: () => new Response(JSON.stringify({ items: [] }), { status: 200 }) },
    ]);

    renderProductsPage();

    await screen.findByRole("combobox");
    expect(screen.getByPlaceholderText("Name")).toBeRequired();
    expect(screen.getByPlaceholderText("Price")).toBeRequired();
    expect(screen.getByPlaceholderText("Stock")).toBeRequired();
    expect(screen.getByRole("combobox")).toBeRequired();
  });
});
