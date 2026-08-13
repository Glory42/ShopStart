import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSession, useRequireAdmin } from "./session";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useSession", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    navigateMock.mockClear();
  });

  it("returns the user on a successful /auth/me response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1", role: "ADMIN" }), { status: 200 }),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: "user-1", role: "ADMIN" });
  });

  it("treats a 401 as a signed-out session (null), not an error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe("useRequireAdmin", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    navigateMock.mockClear();
  });

  it("does not redirect while the session is still loading", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));

    renderHook(() => useRequireAdmin(), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no authenticated user", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );

    renderHook(() => useRequireAdmin(), { wrapper });

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: "/login" }));
  });

  it("redirects to /login when the user is authenticated but not an admin", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1", role: "USER" }), { status: 200 }),
    );

    renderHook(() => useRequireAdmin(), { wrapper });

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: "/login" }));
  });

  it("does not redirect an authenticated ADMIN", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1", role: "ADMIN" }), { status: 200 }),
    );

    const { result } = renderHook(() => useRequireAdmin(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
