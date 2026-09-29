/**
 * Renders one or more JSON-LD blocks safely.
 *
 * `JSON.stringify` alone is NOT safe inside a <script> tag: a CMS-controlled
 * string such as a post title containing "</script><script>…" would close the
 * tag and inject markup. Escaping "<" (and the two JS line-separator
 * characters) as unicode escapes keeps the payload valid JSON while making
 * that impossible. `null`/`undefined` renders nothing, so callers can pass
 * "schema only if the page qualifies" directly.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export default function JsonLd({ data }: { data: unknown | unknown[] | null | undefined }) {
  if (!data) return null
  const blocks = Array.isArray(data) ? data.filter(Boolean) : [data]
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </>
  )
}
