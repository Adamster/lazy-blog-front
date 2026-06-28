import { describe, it, expect } from "vitest";
import { Editor, rootCtx, defaultValueCtx } from "@milkdown/kit/core";
import { getMarkdown } from "@milkdown/kit/utils";
import { commentMarks } from "./comment-editor-config";

// Load-bearing check that the curated plugin list has every base parser/serializer plugin — a missing one would drop or mangle output.
async function roundTrip(md: string): Promise<string> {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, md);
    })
    .use(commentMarks)
    .create();
  const out = editor.action(getMarkdown());
  await editor.destroy();
  root.remove();
  return out.trim();
}

describe("comment editor minimal config — markdown round-trip", () => {
  it("preserves plain text", async () => {
    expect(await roundTrip("just a plain comment")).toBe(
      "just a plain comment"
    );
  });

  it("preserves multiple paragraphs", async () => {
    expect(await roundTrip("first line\n\nsecond line")).toBe(
      "first line\n\nsecond line"
    );
  });

  it("preserves an inline GIF image", async () => {
    const out = await roundTrip("look ![gif](https://static.klipy.com/x.gif)");
    expect(out).toContain("![gif](https://static.klipy.com/x.gif)");
  });

  it("round-trips a combined text + GIF body (the owner's loop)", async () => {
    const md = "hi ![gif](https://static.klipy.com/y.gif)";
    const out = await roundTrip(md);
    expect(out).toContain("![gif](https://static.klipy.com/y.gif)");
    expect(out).toContain("hi");
  });
});
