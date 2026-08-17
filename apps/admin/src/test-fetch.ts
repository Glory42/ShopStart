import { vi } from "vitest";

type FetchRoute = { method: string; urlIncludes: string; response: () => Response };

/**
 * None of the admin routes call TanStack Router's useLoaderData/useSearch
 * (they fetch through react-query's useQuery instead), so tests render
 * Route.options.component directly with Link/useNavigate stubbed rather
 * than mounting a real router — see docs/adr/0006-testing-strategy.md.
 * That means the only thing route tests need mocked is fetch.
 *
 * Every route also calls useRequireAdmin() (via useSession()), so tests
 * almost always need a GET /auth/me handler returning an authenticated
 * ADMIN user for the screen's real content to render at all.
 */
export function mockFetch(routes: FetchRoute[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const match = routes.find((r) => method === r.method && url.includes(r.urlIncludes));
      if (!match) throw new Error(`Unhandled fetch in mockFetch: ${method} ${url}`);
      return Promise.resolve(match.response());
    }),
  );
}

export const adminUser = {
  id: "aaaaaaaa-0000-4000-8000-000000000001",
  email: "admin@shopstart.dev",
  username: "admin",
  phone: null,
  role: "ADMIN",
  createdAt: "2026-01-01T00:00:00.000Z",
};

export function authMeHandler(user: unknown = adminUser): FetchRoute {
  return {
    method: "GET",
    urlIncludes: "/auth/me",
    response: () => new Response(JSON.stringify(user), { status: 200 }),
  };
}
