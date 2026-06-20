"use client";

import { useEffect } from "react";
import Link from "next/link";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const display = "'Space Grotesk', system-ui, sans-serif";

/**
 * Root-level error boundary — replaces the whole layout, so it can't rely on
 * the design tokens / Tailwind being present. Self-contained inline styles
 * approximate the Brutalist-Mono "glitch" error page (dark, mono, accent).
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#1a1a1a",
          color: "#dcdcdc",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 40px",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
          <div
            style={{
              marginBottom: 24,
              fontSize: 11,
              letterSpacing: ".14em",
              color: "#ff6b6b",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 7, height: 7, background: "#ff6b6b" }}
            />
            RUNTIME EXCEPTION · 500
          </div>

          <h1
            style={{
              margin: 0,
              fontFamily: display,
              fontSize: "clamp(32px,6vw,48px)",
              lineHeight: 1.04,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            A glitch in the Lazyverse
          </h1>

          <p
            style={{
              marginTop: 20,
              maxWidth: "42ch",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#9a9a9a",
            }}
          >
            {error?.message ||
              "Something broke on our side. Try again, or head back home."}
          </p>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                height: 36,
                padding: "0 16px",
                background: "#cdff48",
                color: "#1a1a1a",
                border: 0,
                fontFamily: display,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: ".06em",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                height: 36,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 16px",
                border: "2px solid #383838",
                color: "#9a9a9a",
                textDecoration: "none",
                fontFamily: display,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: ".06em",
              }}
            >
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
