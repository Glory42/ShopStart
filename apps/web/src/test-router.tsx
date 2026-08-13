import { createRouter, createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { routeTree } from "./routeTree.gen";

type FetchRoute = { method: string; urlIncludes: string; response: () => Response };

/**
 * Route components under test (products list, product detail, cart) call
 * TanStack Router hooks (useLoaderData, useSearch) that only work inside a
 * real router context — not something you can stub with a simple mock like
 * Link/useNavigate. This mounts the actual app routeTree at the given path
 * so loaders genuinely run, real navigation works, and the test exercises
 * the same wiring production does.
 *
 * The root layout renders <Nav>, which always calls GET /auth/me (and GET
 * /cart if signed in) — include handlers for those unless the test wants
 * the default signed-out 401.
 */
export async function renderRoute(path: string, fetchRoutes: FetchRoute[] = []) {
  const hasAuthMeHandler = fetchRoutes.some((r) => r.urlIncludes.includes("/auth/me"));
  const allRoutes: FetchRoute[] = hasAuthMeHandler
    ? fetchRoutes
    : [
        {
          method: "GET",
          urlIncludes: "/auth/me",
          response: () => new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
        },
        ...fetchRoutes,
      ];

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const match = allRoutes.find((r) => method === r.method && url.includes(r.urlIncludes));
      if (!match) throw new Error(`Unhandled fetch in renderRoute: ${method} ${url}`);
      return Promise.resolve(match.response());
    }),
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...result, router };
}
