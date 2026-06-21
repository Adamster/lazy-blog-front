"use client";

import { useRef, useState, type ComponentType } from "react";
import { useClickOutside } from "react-haiku";
import type { $Command } from "@milkdown/kit/utils";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleLinkCommand,
  wrapInHeadingCommand,
  turnIntoTextCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  insertHrCommand,
  createCodeBlockCommand,
} from "@milkdown/kit/preset/commonmark";
import {
  toggleStrikethroughCommand,
  insertTableCommand,
} from "@milkdown/kit/preset/gfm";
import {
  PlusIcon,
  PhotoIcon,
  LinkIcon,
  ListBulletIcon,
  NumberedListIcon,
  TableCellsIcon,
  MinusIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { toggleSmallCommand } from "./editor-small-mark";

/** Dispatch a Milkdown command into the live editor (owned by `crepe.tsx`). */
export type RunCommand = <T>(cmd: $Command<T>, payload?: T) => void;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

function ToolBtn({
  label,
  glyph,
  glyphClass = "",
  icon: Icon,
  onPress,
  disabled,
}: {
  label: string;
  /** Text glyph (B/I/S/H2/…) — preferred where a clean letterform exists. */
  glyph?: string;
  glyphClass?: string;
  /** Line icon — for actions with no clean glyph (e.g. Link). */
  icon?: ComponentType<{ className?: string }>;
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
      {Icon ? (
        <Icon className="size-3.5" />
      ) : (
        <span aria-hidden="true" className={glyphClass}>
          {glyph}
        </span>
      )}
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

interface InsertItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  run: () => void;
}

/**
 * Icon-triggered toolbar dropdown (Insert, Effects, …). Brutalist-Mono: a `h-9`
 * icon trigger + chevron, opening a square 2px-`--m-dim` `--m-card` popover of
 * mono rows. The popover rows match `Select`'s highlight (panel bg + fg text on
 * hover — NOT accent) so all dropdowns read identically. Like the `ToolBtn`s,
 * every interactive part `preventDefault`s on mousedown so dispatching a command
 * never blurs the live editor (the selection the command acts on must survive).
 */
function ToolbarMenu({
  icon: Icon,
  label,
  items,
  disabled,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  items: InsertItem[];
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative flex-none">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        // Preserve the editor selection on open (same as the buttons).
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={`flex h-9 flex-none items-center gap-0.5 px-2 text-[var(--m-muted)] transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-accent)] disabled:opacity-50 ${focusRing}`}
      >
        <Icon className="size-[18px]" />
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="mono-scrollbar absolute top-full right-0 z-30 mt-1 max-h-72 min-w-44 overflow-auto border-2 border-[var(--m-dim)] bg-[var(--m-card)] py-1"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              // Same selection guard — the command must act on the editor's
              // current selection, not blur it first.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                item.run();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-medium tracking-[0.12em] text-[var(--m-muted)] uppercase transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-fg)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Persistent formatting toolbar — the top edge of the Step-2 editor frame and
 * the SINGLE source of formatting (the slash menu is gone). Standing buttons
 * cover the common actions; the "Insert ▾" dropdown holds block-level inserts.
 * Buttons dispatch Milkdown commands into the live editor via `onCommand`; the
 * Image button uploads through `onInsertImage`. Sticky so it stays put on long
 * posts; horizontally scrollable (brutalist scrollbar) when it can't fit.
 */
export function EditorToolbar({
  onCommand,
  onInsertImage,
  disabled = false,
}: {
  onCommand: RunCommand;
  /** Upload + insert an image at the selection (owned by `crepe.tsx`). */
  onInsertImage: (file: File) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertItems: InsertItem[] = [
    {
      id: "image",
      label: "Image",
      icon: PhotoIcon,
      // Opens the hidden file picker → authed upload → insert (see below).
      run: () => fileInputRef.current?.click(),
    },
    // A small starter grid (3 rows × 3 cols incl. the header row) — enough to
    // show structure without flooding the column; the user grows it inline.
    {
      id: "table",
      label: "Table",
      icon: TableCellsIcon,
      run: () => onCommand(insertTableCommand, { row: 3, col: 3 }),
    },
    {
      id: "divider",
      label: "Divider",
      icon: MinusIcon,
      run: () => onCommand(insertHrCommand),
    },
    {
      id: "quote",
      label: "Quote",
      icon: ChatBubbleBottomCenterTextIcon,
      run: () => onCommand(wrapInBlockquoteCommand),
    },
    {
      id: "code",
      label: "Code block",
      icon: CodeBracketIcon,
      run: () => onCommand(createCodeBlockCommand),
    },
  ];

  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 border-2 border-[var(--m-line)] border-b-[var(--m-dim)] bg-[var(--m-card)] px-4 py-2">
      {/* Scrollable format buttons. The horizontal scroll lives on THIS inner
          row (not the bar) so the Insert popover — a sibling in the non-overflow
          outer — isn't clipped by `overflow-x-auto`. */}
      <div className="mono-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {/* Headings + paragraph */}
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
        <ToolBtn
          label="Paragraph"
          glyph="P"
          glyphClass="text-[12px] font-semibold"
          disabled={disabled}
          onPress={() => onCommand(turnIntoTextCommand)}
        />

        <Divider />

        {/* Inline marks */}
        <ToolBtn
          label="Small text"
          glyph="SM"
          glyphClass="text-[11px] font-semibold tracking-[0.06em]"
          disabled={disabled}
          onPress={() => onCommand(toggleSmallCommand)}
        />
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
          label="Link"
          icon={LinkIcon}
          disabled={disabled}
          // Toggle a link on the selection; the (enabled) LinkTooltip edits the URL.
          onPress={() => onCommand(toggleLinkCommand, { href: "" })}
        />

        <Divider />

        {/* Lists — standing buttons (used often enough that the dropdown was
          fiddly); the rarer inserts stay in the Insert ▾ menu. */}
        <ToolBtn
          label="Bullet list"
          icon={ListBulletIcon}
          disabled={disabled}
          onPress={() => onCommand(wrapInBulletListCommand)}
        />
        <ToolBtn
          label="Ordered list"
          icon={NumberedListIcon}
          disabled={disabled}
          onPress={() => onCommand(wrapInOrderedListCommand)}
        />

        {/* Hidden file picker — opened by the Insert ▾ "Image" item; the chosen
          file is uploaded (authed) and inserted via `onInsertImage`. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onInsertImage(file);
            // Reset so picking the same file again re-fires onChange.
            e.target.value = "";
          }}
        />
      </div>

      <Divider />

      {/* Block-level inserts — outside the scroll row so the popover isn't
          clipped by the inner `overflow-x-auto`. */}
      <ToolbarMenu
        icon={PlusIcon}
        label="Insert"
        items={insertItems}
        disabled={disabled}
      />
    </div>
  );
}
