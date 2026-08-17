import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderRoute } from "../test-router";

describe("root notFoundComponent", () => {
  it("shows 'Page not found' with a link back to shopstart for an unmatched path", async () => {
    await renderRoute("/this-page-does-not-exist");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: "Back to shopstart" })).toHaveAttribute("href", "/");
  });
});

describe("root errorComponent", () => {
  it("shows 'Something went wrong' with the thrown error's message when a loader fails", async () => {
    await renderRoute("/", [
      {
        method: "GET",
        urlIncludes: "/categories",
        response: () =>
          new Response(JSON.stringify({ message: "Database offline" }), { status: 500 }),
      },
      {
        method: "GET",
        urlIncludes: "/products",
        response: () => new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }),
      },
    ]);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument(),
    );
    expect(screen.getByText("Database offline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to shopstart" })).toHaveAttribute("href", "/");
  });
});
