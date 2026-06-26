interface FieldErrorProps {
  /** Validation message text. */
  error: string;
  /** DOM id wired to the control's `aria-describedby`. */
  id?: string;
}

/**
 * Field validation message — the ONE treatment for every form error (Field,
 * Textarea, Select, and hand-rolled composer fields). 11px terminal label
 * scale (0.12em tracking, `--m-error`), `! ` prefix, `role="alert"`, hugging
 * the control at 8px via `.mono-error`. Keeps error typography + spacing from
 * drifting per-surface.
 */
export function FieldError({ error, id }: FieldErrorProps) {
  return (
    <p id={id} role="alert" className="mono-error">
      {`! ${error}`}
    </p>
  );
}
