"use client";

import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "react-haiku";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { ConsoleTitleBar, UnderlineTabs } from "@/shared/ui";
import { GifPicker } from "@/features/comment/ui/gif-picker";
import { parseGifUrl } from "@/features/comment/lib/comment-gif";
import type { GifResult } from "@/features/comment/lib/klipy";
import type { CommentEditorApi } from "./comment-editor";

// Curated native-unicode emoji set — rendered by the OS (crisp, zero deps/CDN).
// Sorted FACES → HANDS → everything else; 84 = a full 7×12 grid.
const EMOJIS = [
  // Faces
  "😀",
  "😁",
  "😂",
  "🤣",
  "😅",
  "😊",
  "🙂",
  "😉",
  "😇",
  "🥰",
  "😍",
  "😘",
  "😋",
  "😎",
  "🥳",
  "😝",
  "🤪",
  "😏",
  "🤤",
  "😴",
  "🥱",
  "🤔",
  "🧐",
  "🤓",
  "😐",
  "😶",
  "🙄",
  "😬",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😡",
  "🤯",
  "😱",
  "😵",
  "🤧",
  "🤮",
  "🥴",
  "😷",
  "🤗",
  "🫠",
  "😈",
  "🤡",
  "👻",
  "👽",
  "🤖",
  "💩",
  "💀",
  "👀",
  // Hands
  "👍",
  "👎",
  "👌",
  "✌️",
  "🤞",
  "🤙",
  "🤘",
  "👏",
  "🙌",
  "🙏",
  "🤝",
  "✊",
  "👊",
  "💪",
  "👋",
  "🫶",
  "🤌",
  "🫡",
  "🤷",
  // Everything else
  "❤️",
  "💔",
  "🔥",
  "✨",
  "⭐",
  "🌈",
  "💯",
  "🎉",
  "🎂",
  "🎁",
  "☕",
  "🍕",
  "⚡",
  "🚀",
  "✅",
];

type PickerTab = "emoji" | "gif" | "sticker";

// Funny, on-brand console header line — kept as a single swap-in const so the
// copywriter's final pick drops straight in.
const PICKER_TITLE = "emote.sh";

const TABS: readonly { id: PickerTab; label: string }[] = [
  { id: "emoji", label: "emoji" },
  { id: "gif", label: "gif" },
  { id: "sticker", label: "sticker" },
];

interface CommentToolbarProps {
  /** The live editor API (insert emoji/GIF/sticker). `null` until ready. */
  api: CommentEditorApi | null;
}

/**
 * Minimal comment-composer toolbar — TEXT + PICTURES only: comments carry no
 * formatting marks, so the toolbar is just a single picture trigger. ONE smiley
 * button toggles a shared popover laid out console-header → underline tabs →
 * panel: the emoji / GIF / sticker panels are switched by the shared
 * {@link UnderlineTabs}, a full row directly under the title bar. An emoji
 * inserts its unicode char at the cursor; a GIF/sticker inserts
 * an INLINE IMAGE node (whitelist-gated via `parseGifUrl`) that renders the
 * actual picture in the editor — never a raw URL.
 */
export function CommentToolbar({ api }: CommentToolbarProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PickerTab>("emoji");
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const disabled = api === null;

  useClickOutside(pickerRef, () => setOpen(false));

  // Close on Escape, returning focus to the smiley trigger (matches the old form).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const insertEmoji = (emoji: string) => {
    api?.insertText(emoji);
    setOpen(false);
  };

  const insertGif = (gif: GifResult) => {
    // Defence in depth: only ever insert a whitelisted KLIPY/Tenor https URL —
    // the read view gates again, but the editor must not carry an off-list src.
    const safe = parseGifUrl(gif.fullUrl);
    if (safe) api?.insertImage(safe, gif.title);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* ONE smiley trigger; the popover is anchored to this wrapper so it opens
          upward-left above the toolbar. */}
      <div ref={pickerRef} className="relative flex items-center">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Insert emoji, GIF or sticker"
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((cur) => !cur)}
          className={`mono-icon-btn mono-focus size-9`}
        >
          <FaceSmileIcon className="size-4 shrink-0" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Emoji, GIF and sticker picker"
            className="absolute bottom-full left-0 z-[var(--m-z-dropdown)] mb-3 w-[420px] max-w-[calc(100vw-5rem)] border-2 border-[var(--m-dim)] bg-[var(--m-bg)]"
          >
            {/* Terminal-chrome header (a short funny line) → shared underline
                tab bar → active panel. The HEADER keeps its `--m-dim` divider;
                the tab row drops its OWN baseline (`baseline={false}`) and is
                inset (px-4) to line up with the grid below — so there's one
                header rule plus only the active accent underline, never a
                doubled line. */}
            <ConsoleTitleBar title={PICKER_TITLE} />

            <UnderlineTabs
              tabs={TABS}
              current={tab}
              onSelect={(id) => setTab(id as PickerTab)}
              ariaLabel="Emoji, GIF and sticker panels"
              baseline={false}
              className="mt-4 bg-[var(--m-card)] px-4 pt-3"
            />

            {tab === "emoji" ? (
              // Edge inset (px-4) matches the header-menu panel's rows.
              <div className="grid grid-cols-12 gap-[2px] px-4 pt-4 pb-4">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`Insert ${emoji}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertEmoji(emoji)}
                    className={`mono-focus flex aspect-square items-center justify-center bg-[var(--m-card)] text-[18px] leading-none transition-colors hover:bg-[var(--m-panel)]`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <GifPicker onPick={insertGif} kind={tab} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
