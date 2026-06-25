import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostBody } from "./post-body";

describe("PostBody", () => {
  it("renders markdown headings", () => {
    const { container } = render(<PostBody markdown={"# Hello\n\nworld"} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Hello" })
    ).toBeInTheDocument();
    expect(container.querySelector(".mono-prose")).toBeInTheDocument();
  });

  it("renders links with safe rel/target for external URLs", () => {
    render(<PostBody markdown={"[site](https://example.com)"} />);
    const link = screen.getByRole("link", { name: "site" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not add target/_blank for relative links", () => {
    render(<PostBody markdown={"[home](/home)"} />);
    const link = screen.getByRole("link", { name: "home" });
    expect(link).not.toHaveAttribute("target");
  });

  it("renders fenced code blocks", () => {
    const { container } = render(
      <PostBody markdown={"```\nconst x = 1;\n```"} />
    );
    const code = container.querySelector("pre code");
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent("const x = 1;");
  });

  it("escapes raw HTML — the security property (no rehype-raw)", () => {
    const { container } = render(
      <PostBody markdown={'<script>alert("xss")</script>\n\nafter'} />
    );
    // Raw HTML must NOT be parsed into live DOM nodes.
    expect(container.querySelector("script")).toBeNull();
    // It is rendered as inert, escaped text instead.
    expect(container.textContent).toContain('<script>alert("xss")</script>');
  });

  it("does not render a raw <img> from injected HTML", () => {
    const { container } = render(
      <PostBody markdown={'<img src="x" onerror="alert(1)" />'} />
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders a bare YouTube link as an embed iframe (nocookie, validated id)", () => {
    const { container } = render(
      <PostBody markdown={"https://youtu.be/dQw4w9WgXcQ"} />
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    expect(iframe).toHaveAttribute("loading", "lazy");
    // No plain link is left behind.
    expect(container.querySelector("a")).toBeNull();
  });

  it("renders a bare Spotify track link as an embed iframe", () => {
    const { container } = render(
      <PostBody
        markdown={"https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"}
      />
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute(
      "src",
      "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT"
    );
    expect(iframe).toHaveAttribute("height", "152");
  });

  it("leaves a malformed/unknown media URL as a plain link (no iframe)", () => {
    const { container } = render(
      <PostBody markdown={"https://youtu.be/tooShort"} />
    );
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("a")).toBeInTheDocument();
  });

  it("does not embed a YT link mixed with other prose in the paragraph", () => {
    const { container } = render(
      <PostBody markdown={"watch this https://youtu.be/dQw4w9WgXcQ now"} />
    );
    expect(container.querySelector("iframe")).toBeNull();
  });
});
