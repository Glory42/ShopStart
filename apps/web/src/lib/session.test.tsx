import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSession } from "./session";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useSession", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns the user on a successful /auth/me response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1", email: "customer@shopstart.dev" }), {
        status: 200,
      }),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: "user-1", email: "customer@shopstart.dev" });
  });

  it("treats a 401 as a signed-out session (null), not an error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("surfaces a non-401 failure as a query error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ message: "Server error" }), { status: 500 }),
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
