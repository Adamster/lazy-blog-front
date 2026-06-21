"use client";

import type { $Command } from "@milkdown/kit/utils";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  insertHrCommand,
} from "@milkdown/kit/preset/commonmark";
import { toggleStrikethroughCommand } from "@milkdown/kit/preset/gfm";

/** Dispatch a Milkdown command into the live editor (owned by `crepe.tsx`). */
export type RunCommand = <T>(cmd: $Command<T>, payload?: T) => void;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

function ToolBtn({
  label,
  glyph,
  glyphClass = "",
  onPress,
  disabled,
}: {
  label: string;
  glyph: string;
  glyphClass?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      // Keep the editor selection — clicking the button must not blur it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={`flex size-9 flex-none items-center justify-center text-[14px] leading-none text-[var(--m-muted)] transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-accent)] disabled:opacity-50 ${focusRing}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <span aria-hidden="true" className={glyphClass}>
        {glyph}
      </span>
    </button>
  );
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="mx-1 h-5 w-0.5 flex-none bg-[var(--m-dim)]"
    />
  );
}

/**
 * Persistent formatting toolbar — the top edge of the Step-2 editor frame. Every
 * action is on screen (no slash/bubble needed to discover it); buttons dispatch
 * Milkdown commands into the live editor via `onCommand`. Sticky so it stays put
 * on long posts; horizontally scrollable (brutalist scrollbar) when it can't fit.
 */
export function EditorToolbar({
  onCommand,
  disabled = false,
}: {
  onCommand: RunCommand;
  disabled?: boolean;
}) {
  return (
    <div className="mono-scrollbar sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-2 border-[var(--m-line)] border-b-[var(--m-dim)] bg-[var(--m-card)] px-4 py-2">
      {/* Inline */}
      <ToolBtn
        label="Bold"
        glyph="B"
        glyphClass="font-bold"
        disabled={disabled}
        onPress={() => onCommand(toggleStrongCommand)}
      />
      <ToolBtn
        label="Italic"
        glyph="I"
        glyphClass="font-semibold italic"
        disabled={disabled}
        onPress={() => onCommand(toggleEmphasisCommand)}
      />
      <ToolBtn
        label="Strikethrough"
        glyph="S"
        glyphClass="line-through"
        disabled={disabled}
        onPress={() => onCommand(toggleStrikethroughCommand)}
      />
      <ToolBtn
        label="Inline code"
        glyph="</>"
        glyphClass="text-[12px]"
        disabled={disabled}
        onPress={() => onCommand(toggleInlineCodeCommand)}
      />

      <Divider />

      {/* Headings */}
      <ToolBtn
        label="Heading 1"
        glyph="H1"
        glyphClass="text-[12px] font-semibold"
        disabled={disabled}
        onPress={() => onCommand(wrapInHeadingCommand, 1)}
      />
      <ToolBtn
        label="Heading 2"
        glyph="H2"
        glyphClass="text-[12px] font-semibold"
        disabled={disabled}
        onPress={() => onCommand(wrapInHeadingCommand, 2)}
      />
      <ToolBtn
        label="Heading 3"
        glyph="H3"
        glyphClass="text-[12px] font-semibold"
        disabled={disabled}
        onPress={() => onCommand(wrapInHeadingCommand, 3)}
      />

      <Divider />

      {/* Lists & blocks */}
      <ToolBtn
        label="Bullet list"
        glyph="•"
        disabled={disabled}
        onPress={() => onCommand(wrapInBulletListCommand)}
      />
      <ToolBtn
        label="Ordered list"
        glyph="1."
        glyphClass="text-[12px]"
        disabled={disabled}
        onPress={() => onCommand(wrapInOrderedListCommand)}
      />
      <ToolBtn
        label="Quote"
        glyph="❝"
        disabled={disabled}
        onPress={() => onCommand(wrapInBlockquoteCommand)}
      />

      <Divider />

      {/* Insert */}
      <ToolBtn
        label="Divider"
        glyph="―"
        disabled={disabled}
        onPress={() => onCommand(insertHrCommand)}
      />
    </div>
  );
}
