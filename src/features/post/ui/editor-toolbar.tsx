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
  SparklesIcon,
  BoltIcon,
  CommandLineIcon,
  SwatchIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { toggleSmallCommand } from "./editor-small-mark";
import {
  toggleGlitchCommand,
  toggleMatrixCommand,
} from "./editor-effect-marks";
import {
  setPrimaryCommand,
  setMutedCommand,
  setErrorCommand,
  clearColorCommand,
} from "./editor-color-marks";

export type RunCommand = <T>(cmd: $Command<T>, payload?: T) => void;

function ToolBtn({
  label,
  glyph,
  glyphClass = "",
  icon: Icon,
  onPress,
  disabled,
}: {
  label: string;
  glyph?: string;
  glyphClass?: string;
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
      className={`mono-focus flex size-9 flex-none items-center justify-center text-[14px] leading-none text-[var(--m-muted)] transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-accent)] disabled:opacity-50`}
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
  icon?: ComponentType<{ className?: string }>;
  // Takes precedence over `icon` when set.
  swatch?: string;
  run: () => void;
}

// Every interactive part preventDefaults on mousedown so dispatching a command
// never blurs the live editor (the command's selection must survive).
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
        className={`mono-focus flex h-9 flex-none items-center gap-0.5 px-2 text-[var(--m-muted)] transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-accent)] disabled:opacity-50`}
      >
        <Icon className="size-4" />
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="mono-scrollbar absolute top-full right-0 z-[var(--m-z-dropdown)] mt-1 max-h-72 min-w-44 overflow-auto border-2 border-[var(--m-dim)] bg-[var(--m-card)] py-1"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              // Selection guard — act on the editor's current selection, not blur it.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                item.run();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] leading-none font-medium tracking-[0.12em] text-[var(--m-muted)] uppercase transition-colors hover:bg-[var(--m-panel)] hover:text-[var(--m-fg)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {item.swatch ? (
                // Border keeps a pale/transparent swatch visible against the row.
                <span
                  aria-hidden="true"
                  className="size-3.5 shrink-0 border-2 border-[var(--m-dim)]"
                  style={{ backgroundColor: item.swatch }}
                />
              ) : item.icon ? (
                <item.icon className="size-4 shrink-0" />
              ) : null}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// The SINGLE source of formatting — the slash menu is gone.
export function EditorToolbar({
  onCommand,
  onInsertImage,
  disabled = false,
}: {
  onCommand: RunCommand;
  onInsertImage: (file: File) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertItems: InsertItem[] = [
    {
      id: "image",
      label: "Image",
      icon: PhotoIcon,
      run: () => fileInputRef.current?.click(),
    },
    // Small starter grid — enough to show structure without flooding the column.
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

  // TODO(block-fx): the BLOCK directives (`::divider`, `:::callout`, `:::poll`,
  // `:::fold`) render in the read view but have NO editor authoring UI yet —
  // Crepe block nodes are non-trivial plumbing vs the 1:1 inline-mark pattern
  // here. Author them by typing the raw directive for now; wire nodes later.
  const effectItems: InsertItem[] = [
    {
      id: "glitch",
      label: "Glitch",
      icon: BoltIcon,
      run: () => onCommand(toggleGlitchCommand),
    },
    {
      id: "matrix",
      label: "Matrix",
      icon: CommandLineIcon,
      run: () => onCommand(toggleMatrixCommand),
    },
  ];

  const colorItems: InsertItem[] = [
    {
      id: "color-default",
      label: "Default",
      swatch: "var(--m-fg)",
      run: () => onCommand(clearColorCommand),
    },
    {
      id: "color-primary",
      label: "Primary",
      swatch: "var(--m-accent)",
      run: () => onCommand(setPrimaryCommand),
    },
    {
      id: "color-muted",
      label: "Muted",
      swatch: "var(--m-muted)",
      run: () => onCommand(setMutedCommand),
    },
    {
      id: "color-error",
      label: "Error",
      swatch: "var(--m-error)",
      run: () => onCommand(setErrorCommand),
    },
  ];

  return (
    <div className="sticky top-0 z-[var(--m-z-content)] flex items-center gap-1 border-2 border-[var(--m-dim)] bg-[var(--m-card)] px-4 py-2">
      {/* Horizontal scroll lives on THIS inner row (not the bar) so the Insert
          popover — a sibling in the non-overflow outer — isn't clipped. */}
      <div className="mono-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
          onPress={() => onCommand(toggleLinkCommand, { href: "" })}
        />

        <Divider />

        {/* Lists are standing buttons — used often enough that the dropdown was fiddly. */}
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

      {/* Outside the scroll row so the popover isn't clipped by `overflow-x-auto`. */}
      <ToolbarMenu
        icon={PlusIcon}
        label="Insert"
        items={insertItems}
        disabled={disabled}
      />

      <ToolbarMenu
        icon={SparklesIcon}
        label="Effects"
        items={effectItems}
        disabled={disabled}
      />

      <ToolbarMenu
        icon={SwatchIcon}
        label="Text colour"
        items={colorItems}
        disabled={disabled}
      />
    </div>
  );
}
