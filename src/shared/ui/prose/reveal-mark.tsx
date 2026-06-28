interface RevealMarkProps {
  children: string;
  variant: "blur" | "strike";
  className?: string;
}

const BASE: Record<RevealMarkProps["variant"], string> = {
  blur: "mono-spoiler",
  strike: "mono-strike",
};

export function RevealMark({
  children,
  variant,
  className = "",
}: RevealMarkProps) {
  const interactive = variant === "blur";

  return (
    <span
      className={`${BASE[variant]} ${className}`}
      {...(interactive ? { tabIndex: 0, role: "button" } : {})}
      aria-label={variant === "blur" ? `Spoiler: ${children}` : undefined}
    >
      {children}
    </span>
  );
}
