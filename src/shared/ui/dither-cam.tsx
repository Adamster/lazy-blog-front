"use client";

import { useCallback, useRef, useState } from "react";
import { ConsoleTitleBar } from "./overlays/console";

/** Density ramp, dense → sparse (dark pixel = dense glyph). */
const RAMP = "@%#*+=-:. ";
const COLS = 64;

/**
 * ASCII dithercam — drop or pick an image and it renders as a live density-glyph
 * portrait in `--m-accent` on the screen-black panel (the documented `#0d0d0d`
 * exception, 2px `--m-dim`). Canvas-samples the image to a `COLS`-wide luminance
 * grid mapped onto the RAMP. LAB-only. Reduced motion: still renders the final
 * frame (this is a static end-state, not an animation — no per-frame motion).
 */
export function DitherCam({ className = "" }: { className?: string }) {
  const [art, setArt] = useState<string>("");
  const [hint, setHint] = useState("drop an image here / click to pick");
  const fileRef = useRef<HTMLInputElement>(null);

  const render = useCallback((img: HTMLImageElement) => {
    const ratio = img.height / img.width || 1;
    // Glyph cells are ~2:1 tall, so halve the row count for an even aspect.
    const rows = Math.max(1, Math.round(COLS * ratio * 0.5));
    const canvas = document.createElement("canvas");
    canvas.width = COLS;
    canvas.height = rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, COLS, rows);
    const { data } = ctx.getImageData(0, 0, COLS, rows);
    let out = "";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = (y * COLS + x) * 4;
        const lum =
          (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        const idx = Math.min(
          RAMP.length - 1,
          Math.floor((1 - lum) * (RAMP.length - 1))
        );
        out += RAMP[idx];
      }
      out += "\n";
    }
    setArt(out);
  }, []);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        render(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
      setHint(file.name);
    },
    [render]
  );

  return (
    <div className={`border-2 border-[var(--m-dim)] bg-[#0d0d0d] ${className}`}>
      <ConsoleTitleBar title="dithercam ~ /dev/video1" />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) loadFile(file);
        }}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
        aria-label="Drop or pick an image to dither"
        className="mono-scrollbar max-h-[320px] min-h-[200px] cursor-pointer overflow-auto p-5"
      >
        {art ? (
          <pre className="[font-family:var(--font-mono)] text-[10px] leading-[1] text-[var(--m-accent)]">
            {art}
          </pre>
        ) : (
          <div className="flex h-[160px] items-center justify-center text-[11px] tracking-[0.12em] text-[var(--m-muted2)] uppercase">
            {hint}
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadFile(file);
        }}
      />
    </div>
  );
}
