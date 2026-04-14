"use client";

import * as React from "react";

type Props = {
  text: string | null;
  isHtml?: boolean;
  maxLines?: number;
};

export function ProductDescription({ text, isHtml, maxLines = 3 }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [needsClamp, setNeedsClamp] = React.useState(false);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setNeedsClamp(el.scrollHeight > el.clientHeight + 4);
  }, [text]);

  if (!text) return null;

  const clampClass = !expanded ? `line-clamp-${maxLines}` : "";

  return (
    <div>
      {isHtml ? (
        <div
          ref={contentRef}
          className={`text-sm leading-relaxed text-slate-600 transition-all [&_a]:text-emerald-600 [&_a]:underline [&_p+p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-4 ${
            !expanded ? "max-h-[4.5rem] overflow-hidden" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : (
        <p
          ref={contentRef as React.RefObject<HTMLParagraphElement>}
          className={`whitespace-pre-wrap text-sm leading-relaxed text-slate-600 ${clampClass}`}
        >
          {text}
        </p>
      )}
      {(needsClamp || (isHtml && !expanded)) && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
