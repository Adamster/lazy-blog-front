// Blinking square status cue — sits before a label/eyebrow as a "live" marker
// (`▪ NO HDR · FILM-LOOK PRESETS`). Decorative: always aria-hidden.
export function Cue({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`mono-cue${className ? ` ${className}` : ""}`}
    />
  );
}
