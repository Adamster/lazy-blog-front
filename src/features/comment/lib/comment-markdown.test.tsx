import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { renderCommentMarkdown } from "./comment-markdown";

const Body = ({ md }: { md: string }) => <div>{renderCommentMarkdown(md)}</div>;

describe("renderCommentMarkdown — inline marks", () => {
  it("renders bold / italic / strike", () => {
    const { container } = render(<Body md="**b** *i* ~~s~~" />);
    // The leaf text is wrapped in a <span> inside each mark element; assert the
    // mark element exists and carries the right text.
    expect(container.querySelector("strong")?.textContent).toBe("b");
    expect(container.querySelector("em")?.textContent).toBe("i");
    const strike = container.querySelector(".line-through");
    expect(strike?.textContent).toBe("s");
  });
});

describe("renderCommentMarkdown — inline GIF images (security)", () => {
  it("renders a WHITELISTED KLIPY image as an <img>", () => {
    const url = "https://static.klipy.com/abc/def.gif";
    const { container } = render(<Body md={`hi ![gif](${url})`} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(url);
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("renders a WHITELISTED Tenor image inline among text", () => {
    const url = "https://media.tenor.com/xyz/cat.gif";
    const { container } = render(<Body md={`before ![x](${url}) after`} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(url);
    expect(container.textContent).toContain("before");
    expect(container.textContent).toContain("after");
  });

  it("LITERALISES a non-whitelisted image URL (no <img>)", () => {
    const md = "![pwn](https://evil.example.com/x.gif)";
    const { container } = render(<Body md={md} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(md);
  });

  it("LITERALISES a non-https whitelisted host (no <img>)", () => {
    const md = "![x](http://static.klipy.com/x.gif)";
    const { container } = render(<Body md={md} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(md);
  });

  it("never emits raw HTML — a literal <img> tag stays text", () => {
    const md = '<img src="https://evil.example.com/x.gif" onerror="alert(1)">';
    const { container } = render(<Body md={md} />);
    // Our own renderer must not have produced a real <img>.
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img");
  });
});
