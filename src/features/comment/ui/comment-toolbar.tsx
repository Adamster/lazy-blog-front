"use client";

import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "react-haiku";
import {
  FaceSmileIcon,
  GifIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { ConsoleTitleBar } from "@/shared/ui/console";
import { GifPicker } from "@/features/comment/ui/gif-picker";
import { parseGifUrl } from "@/features/comment/lib/comment-gif";
import type { GifResult } from "@/features/comment/lib/klipy";
import type { CommentEditorApi } from "./comment-editor";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

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

interface CommentToolbarProps {
  /** The live editor API (insert emoji/GIF/sticker). `null` until ready. */
  api: CommentEditorApi | null;
}

/**
 * Minimal comment-composer toolbar — TEXT + PICTURES only: comments carry no
 * formatting marks, so the toolbar is just the picture triggers. The Emoji /
 * GIF / sticker triggers open a shared popover (the emoji grid + the existing
 * `GifPicker`). An emoji inserts its unicode char at the cursor; a GIF/sticker
 * inserts an INLINE IMAGE node (whitelist-gated via `parseGifUrl`) that renders
 * the actual picture in the editor — never a raw URL.
 */
export function CommentToolbar({ api }: CommentToolbarProps) {
  const [open, setOpen] = useState<false | PickerTab>(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const disabled = api === null;

  useClickOutside(pickerRef, () => setOpen(false));

  // Close on Escape, returning focus to the trigger (matches the old form).
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

  const toggle = (tab: PickerTab) =>
    setOpen((cur) => (cur === tab ? false : tab));

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
      {/* Emoji / GIF / sticker — three triggers sharing one popover, anchored to
          the picker wrapper so it opens upward-left above the toolbar. */}
      <div ref={pickerRef} className="relative flex items-center gap-3">
        <button
          ref={open === "gif" ? triggerRef : undefined}
          type="button"
          aria-label="Insert GIF"
          aria-haspopup="dialog"
          aria-expanded={open === "gif"}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggle("gif")}
          className={`mono-icon-btn size-9 ${focusRing}`}
        >
          <GifIcon className="size-[18px] shrink-0" />
        </button>
        <button
          ref={open === "sticker" ? triggerRef : undefined}
          type="button"
          aria-label="Insert sticker"
          aria-haspopup="dialog"
          aria-expanded={open === "sticker"}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggle("sticker")}
          className={`mono-icon-btn size-9 ${focusRing}`}
        >
          <RectangleStackIcon className="size-[18px] shrink-0" />
        </button>
        <button
          ref={open === "emoji" ? triggerRef : undefined}
          type="button"
          aria-label="Insert emoji"
          aria-haspopup="dialog"
          aria-expanded={open === "emoji"}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggle("emoji")}
          className={`mono-icon-btn size-9 ${focusRing}`}
        >
          <FaceSmileIcon className="size-[18px] shrink-0" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Emoji, GIF and sticker picker"
            className="absolute bottom-full left-0 z-50 mb-3 w-[420px] max-w-[calc(100vw-5rem)] border-2 border-[var(--m-dim)] bg-[var(--m-bg)]"
          >
            {/* Terminal-chrome header like the main menu's `◼ ◻ menu.sh` — shows
                the OPEN picker (`◼ ◻ emoji` / `◼ ◻ gif`). NO tabs: the emoji / GIF
                toolbar buttons above switch which panel is open. */}
            <ConsoleTitleBar title={open} />

            {open === "emoji" ? (
              // Edge inset (px-4) matches the header-menu panel's rows.
              <div className="grid grid-cols-12 gap-[2px] px-4 pt-3 pb-4">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`Insert ${emoji}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertEmoji(emoji)}
                    className={`flex aspect-square items-center justify-center bg-[var(--m-card)] text-[20px] leading-none transition-colors hover:bg-[var(--m-panel)] ${focusRing}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <GifPicker onPick={insertGif} kind={open} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
