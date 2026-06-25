import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select, type SelectOption } from "./select";

const OPTIONS: SelectOption[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
];

describe("Select (single)", () => {
  it("renders a collapsed listbox trigger with the placeholder", () => {
    render(
      <Select
        label="Framework"
        options={OPTIONS}
        value={undefined}
        onChange={() => {}}
        placeholder="Pick one"
      />
    );
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("shows the selected option's label", () => {
    render(
      <Select
        label="Framework"
        options={OPTIONS}
        value="vue"
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Vue")).toBeInTheDocument();
  });

  it("opens the listbox on click and renders options", async () => {
    const user = userEvent.setup();
    render(
      <Select
        label="Framework"
        options={OPTIONS}
        value={undefined}
        onChange={() => {}}
      />
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("selects an option by click and commits its value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        label="Framework"
        options={OPTIONS}
        value={undefined}
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("option", { name: "Svelte" }));
    expect(onChange).toHaveBeenCalledWith("svelte");
  });

  it("supports keyboard selection (ArrowDown to open, Enter to commit)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        label="Framework"
        options={OPTIONS}
        value={undefined}
        onChange={onChange}
      />
    );
    const trigger = screen.getByRole("button");
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    // Listbox opens with the first option active; move down once then commit.
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("vue");
  });

  it("exposes error state via role=alert and aria-describedby", () => {
    render(
      <Select
        label="Framework"
        options={OPTIONS}
        value={undefined}
        onChange={() => {}}
        error="Choose a framework"
      />
    );
    const trigger = screen.getByRole("button");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("! Choose a framework");
    expect(trigger).toHaveAttribute("aria-describedby", alert.id);
  });
});

describe("Select (multiple)", () => {
  it("toggles values without closing and joins selected labels", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        label="Frameworks"
        multiple
        options={OPTIONS}
        value={["react"]}
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole("button"));
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-multiselectable", "true");

    await user.click(screen.getByRole("option", { name: "Vue" }));
    expect(onChange).toHaveBeenCalledWith(["react", "vue"]);
    // Stays open in multi mode.
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
