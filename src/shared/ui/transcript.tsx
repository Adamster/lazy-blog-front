"use client";

import { useInViewOnce } from "@/shared/lib/use-in-view";
import { prefersReducedMotion } from "@/shared/lib/prefers-reduced-motion";
import { ConsoleTitleBar } from "./overlays/console";

/** Prompt + output line of a transcript, mapped to the LAB tone palette. */
export interface TranscriptLine {
  text: string;
  /** prompt = accent · output = muted · error = error. Default "output". */
  tone?: "prompt" | "output" | "error";
}

const TONE_CLASS: Record<NonNullable<TranscriptLine["tone"]>, string> = {
  prompt: "text-[var(--m-accent)]",
  output: "text-[var(--m-muted)]",
  error: "text-[var(--m-error)]",
};

/**
 * Read-only fake-terminal transcript — reuses the {@link ConsoleTitleBar} chrome
 * over the screen-black canvas (the documented `#0d0d0d` exception), 2px
 * `--m-dim` frame, 14px/1.6, `.mono-scrollbar`. The LAB tone map drives line
 * colour (prompt = accent, output = muted, error = error). Lines reveal in one
 * row at a time on scroll-in (pure CSS stagger); reduced motion shows them all
 * at once. Used by the LAB "TRANSCRIPT" toy and the `:::terminal` post block.
 */
export function Transcript({
  title = "transcript.log",
  lines,
  className = "",
}: {
  title?: string;
  lines: TranscriptLine[];
  className?: string;
}) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const reveal = inView && !prefersReducedMotion();

  return (
    <div
      ref={ref}
      className={`border-2 border-[var(--m-dim)] bg-[#0d0d0d] ${className}`}
    >
      <ConsoleTitleBar title={title} />
      <div className="mono-scrollbar max-h-[280px] overflow-auto p-5 text-[14px] leading-[1.6]">
        {lines.map((line, i) => (
          <div
            key={i}
            style={reveal ? { animationDelay: `${i * 70}ms` } : undefined}
            className={`break-words whitespace-pre-wrap ${
              TONE_CLASS[line.tone ?? "output"]
            } ${reveal ? "mono-transcript-line" : ""}`}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
