"use client";

import { useEffect } from "react";
import Link from "next/link";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const display = "'Space Grotesk', system-ui, sans-serif";

/** Replaces the whole layout, so tokens / Tailwind aren't loaded — hence the inline styles. */
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
          background: "#181818",
          color: "#dcdcdc",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 40px",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        {/* Tailwind isn't loaded here — reproduce the 32→40px step at md without the banned clamp(). */}
        <style>{`
          .ge-headline { font-size: 32px; }
          @media (min-width: 768px) { .ge-headline { font-size: 40px; } }
        `}</style>
        <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
          <div
            style={{
              marginBottom: 24,
              fontSize: 11,
              letterSpacing: ".12em",
              color: "#ff6b6b",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 8, height: 8, background: "#ff6b6b" }}
            />
            RUNTIME EXCEPTION · 500
          </div>

          <h1
            className="ge-headline"
            style={{
              margin: 0,
              fontFamily: display,
              lineHeight: 1.04,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            A glitch in the Lazyverse
          </h1>

          <p
            style={{
              marginTop: 16,
              maxWidth: "42ch",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#9a9a9a",
            }}
          >
            {error?.message || "Error detected. Motivation to fix it: pending."}
          </p>

          <div
            style={{
              marginTop: 24,
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
                color: "#181818",
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
