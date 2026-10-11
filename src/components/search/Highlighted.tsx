import { highlightMatch } from "@/lib/highlight";

export default function Highlighted({
  text,
  query,
  className,
}: {
  text: string | null | undefined;
  query: string;
  className?: string;
}) {
  const parts = highlightMatch(text, query);
  if (parts.length === 0) return null;

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.match ? (
          <mark
            key={i}
            className="bg-amber-200 text-amber-900 dark:bg-amber-500/40 dark:text-amber-100 rounded-sm px-0.5"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  );
}