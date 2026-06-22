/**
 * Emits a JSON-LD `<script>` for SEO. `<` is escaped to `<` so a value can
 * never break out of the script tag (the one safe `dangerouslySetInnerHTML` use
 * here). Server-rendered; pass a schema.org object.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
