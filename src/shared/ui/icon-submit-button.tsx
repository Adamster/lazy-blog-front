"use client";

import type { ComponentType } from "react";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { Spinner } from "./loading";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-accent)]";

/**
 * Icon-only primary submit — the composer-Publish pattern, generalised. A 36px
 * (`size-9`) accent `.mono-cta` square, `type=submit`. The glyph DEFAULTS to the
 * `RocketLaunchIcon` (publish/send) but is overridable via `icon` (e.g. a save
 * icon when the action is "save draft", not publish). Used for every
 * "submit / send / save" primary (comment Send, profile Save, auth Log in, …).
 *
 * The icon carries NO visible text, so `label` is REQUIRED and drives BOTH the
 * accessible name (`aria-label`) AND the hover tooltip (`title`) — an icon
 * button without it is unlabelled. While `pending`, the rocket swaps for the
 * Spinner and the button disables (matching {@link SubmitButton} / the profile
 * form action). Extra `className` is appended (e.g. `ml-auto`/`shrink-0`).
 */
export function IconSubmitButton({
  label,
  icon: Icon = RocketLaunchIcon,
  pending = false,
  disabled = false,
  className = "",
}: {
  /** Accessible name + hover tooltip (the icon has no visible text). */
  label: string;
  /** The glyph — defaults to `RocketLaunchIcon` (publish/send). Pass another
   *  (e.g. a save icon) when the submit means something else. */
  icon?: ComponentType<{ className?: string }>;
  pending?: boolean;
  /** Disable the action independent of `pending` (e.g. an empty form). */
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-label={label}
      aria-busy={pending}
      title={label}
      className={`mono-cta inline-flex size-9 shrink-0 items-center justify-center ${focusRing} ${className}`}
    >
      {pending ? (
        <Spinner className="text-[14px]" />
      ) : (
        <Icon className="size-3.5" />
      )}
    </button>
  );
}
