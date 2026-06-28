"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "outline" | "danger";

const BASE = "mono-focus inline-flex h-9 items-center justify-center px-4";

const VARIANT: Record<Variant, string> = {
  primary: "mono-cta font-bold tracking-[0.06em]",
  outline: "mono-btn-outline font-semibold tracking-[0.06em]",
  danger:
    "font-display border-2 border-[var(--m-error)] bg-[var(--m-error)] text-[14px] leading-none font-bold tracking-[0.06em] text-[var(--m-bg)] uppercase transition-colors hover:bg-transparent hover:text-[var(--m-error)] disabled:opacity-60",
};

type ButtonProps = { variant?: Variant; children: ReactNode } & (
  | ({ href: string } & ComponentPropsWithoutRef<"a">)
  | ({ href?: undefined } & ComponentPropsWithoutRef<"button">)
);

/**
 * The boxed action button — 36px, Space Grotesk, the one place `.mono-cta` /
 * `.mono-btn-outline` / the danger fill are spelled. Renders an `<a>` when
 * `href` is given (else a `type="button"` `<button>`); `className` adds layout
 * (`flex-1`, `w-full`, `ml-auto`, a `gap` for an icon). Submit buttons live in
 * `SubmitButton` / `IconSubmitButton`, not here.
 */
export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = `${BASE} ${VARIANT[variant]} ${className ?? ""}`.trim();
  if (rest.href !== undefined) {
    return (
      <a className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
