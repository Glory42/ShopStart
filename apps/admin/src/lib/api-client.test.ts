import { describe, expect, it, vi, beforeEach } from "vitest";
import { api, ApiError } from "./api-client";

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
  });

  it("resolves with parsed JSON on success", async () => {
    await expect(api.get("/ping")).resolves.toEqual({ ok: true });
  });

  it("throws ApiError with the response status on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: "Not found" }), { status: 404 }),
      ),
    );

    await expect(api.get("/missing")).rejects.toBeInstanceOf(ApiError);
  });
});
