import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field } from "./field";

describe("Field", () => {
  it("renders an accessible input labelled by its label text", () => {
    render(<Field label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("does not render an error message by default and is not aria-invalid", () => {
    render(<Field label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("renders the error and wires aria-describedby when error is present", () => {
    render(<Field label="Email" error="Required" />);
    const input = screen.getByLabelText("Email");
    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("! Required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
  });

  it("password field hides input by default and toggles via the eye button", async () => {
    const user = userEvent.setup();
    render(<Field label="Password" type="password" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" })
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("non-password fields have no eye toggle", () => {
    render(<Field label="Email" type="email" />);
    expect(
      screen.queryByRole("button", { name: /password/i })
    ).not.toBeInTheDocument();
  });
});
