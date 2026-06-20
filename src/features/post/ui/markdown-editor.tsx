"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { PostBody } from "@/shared/ui";

interface MarkdownEditorProps {
  /** Markdown source (controlled). */
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

type Tab = "write" | "preview";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/**
 * Live-preview markdown editor: a mono source <textarea> and a live <PostBody>
 * preview. Side-by-side on desktop; a Write/Preview tablist on mobile. The
 * preview uses the SAME <PostBody> as the published page, so what you write is
 * exactly what readers see.
 *
 * The `md:!block` overrides reset the mobile tab-driven `hidden` so both panes
 * are always visible on desktop.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const baseId = useId();
  const writeTabId = `${baseId}-write-tab`;
  const previewTabId = `${baseId}-preview-tab`;
  const writePanelId = `${baseId}-write-panel`;
  const previewPanelId = `${baseId}-preview-panel`;

  // Auto-grow the textarea to fit its content (no inner scrollbar).
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, tab]);

  return (
    <div>
      {/* Mobile tablist (hidden on desktop, where both panes show side by side) */}
      <div
        role="tablist"
        aria-label="Editor view"
        className="mb-4 flex gap-2 md:hidden"
      >
        {(["write", "preview"] as const).map((t) => {
          const selected = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              id={t === "write" ? writeTabId : previewTabId}
              aria-selected={selected}
              aria-controls={t === "write" ? writePanelId : previewPanelId}
              onClick={() => setTab(t)}
              className={`h-9 border-2 px-4 text-[13px] font-bold tracking-[0.06em] uppercase transition-colors ${focusRing} ${
                selected
                  ? "border-[var(--m-accent)] bg-[var(--m-accent)] text-[var(--m-bg)]"
                  : "border-[var(--m-dim)] text-[var(--m-muted)] hover:border-[var(--m-accent)] hover:text-[var(--m-accent)]"
              }`}
            >
              {t === "write" ? "Write" : "Preview"}
            </button>
          );
        })}
      </div>

      <div className="md:flex md:gap-8">
        {/* Write pane */}
        <div
          role="tabpanel"
          id={writePanelId}
          aria-labelledby={writeTabId}
          hidden={tab !== "write"}
          className="min-w-0 md:!block md:flex-1"
        >
          <label htmlFor={`${baseId}-textarea`} className="sr-only">
            Markdown source
          </label>
          <textarea
            ref={textareaRef}
            id={`${baseId}-textarea`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck
            className={`min-h-80 w-full resize-none bg-transparent font-[family-name:var(--font-mono)] text-[14px] leading-[1.7] text-[var(--m-fg)] caret-[var(--m-accent)] outline-none placeholder:text-[var(--m-muted2)] ${focusRing}`}
          />
        </div>

        {/* Preview pane */}
        <div
          role="tabpanel"
          id={previewPanelId}
          aria-labelledby={previewTabId}
          hidden={tab !== "preview"}
          className="min-w-0 md:!block md:flex-1 md:border-l-2 md:border-[var(--m-dim)] md:pl-8"
        >
          {value.trim() ? (
            <PostBody markdown={value} />
          ) : (
            <p className="text-[13px] text-[var(--m-muted2)]">
              Nothing to preview yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
