import { Fragment } from "react";

const TOKEN = /(\$[A-Za-z]{1,5}\b|@\w+|🫧)/g;

/** Renders message text with $TICKERS, @mentions and the bubble emote styled. */
export function MessageContent({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\$[A-Za-z]{1,5}$/.test(part)) {
          return (
            <span
              key={i}
              className="rounded bg-hq/10 px-1 font-mono text-[0.92em] font-semibold text-hq"
            >
              {part}
            </span>
          );
        }
        if (/^@\w+$/.test(part)) {
          return (
            <span key={i} className="font-medium text-bubble">
              {part}
            </span>
          );
        }
        if (part === "🫧") {
          return (
            <span key={i} className="inline-block">
              🫧
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
