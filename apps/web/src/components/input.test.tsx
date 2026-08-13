import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input", () => {
  it("renders with the given placeholder and type", () => {
    render(<Input placeholder="Email" type="email" />);
    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("type", "email");
  });

  it("calls onChange as the user types", async () => {
    const onChange = vi.fn();
    render(<Input placeholder="Email" value="" onChange={onChange} />);

    await userEvent.type(screen.getByPlaceholderText("Email"), "a");

    expect(onChange).toHaveBeenCalled();
  });

  // Regression test: input.tsx originally had no background class, so it
  // rendered with the browser's default white background against the
  // storefront's dark theme (fixed in this same redesign pass).
  it("uses the dark-theme surface background, not the browser default", () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveClass("bg-paper-2");
  });

  it("merges a custom className with its own classes", () => {
    render(<Input placeholder="Email" className="w-full" />);
    expect(screen.getByPlaceholderText("Email")).toHaveClass("w-full", "bg-paper-2");
  });
});
