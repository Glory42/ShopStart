import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonClasses } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Add to bag</Button>);
    expect(screen.getByRole("button", { name: "Add to bag" })).toBeInTheDocument();
  });

  it("fires onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add to bag</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Add to bag" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Add to bag
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Add to bag" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("defaults to the primary variant's accent background", () => {
    render(<Button>Add to bag</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-accent");
  });

  it("applies the invert variant instead of primary when specified", () => {
    render(<Button variant="invert">Back to shopstart</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-ink");
    expect(button).not.toHaveClass("bg-accent");
  });
});

describe("buttonClasses", () => {
  it("merges the variant's classes with a custom className", () => {
    const classes = buttonClasses("ghost", "mt-7");
    expect(classes).toContain("text-accent");
    expect(classes).toContain("mt-7");
  });

  it("defaults to the primary variant when none is given", () => {
    expect(buttonClasses()).toContain("bg-accent");
  });
});
