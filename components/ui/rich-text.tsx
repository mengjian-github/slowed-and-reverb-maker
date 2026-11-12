// RichText — renders a frozen-copy prose string with its inline markdown
// links as real anchors and **bold**/__bold__ as <strong>; every other word
// stays verbatim. Usage: <p><RichText value={content.heroText} /></p>. It
// renders inline, so each value gets its own block: two side by side in one
// <div> print "…every result.Feeding a starter…" (2026-10-27). Site-relative
// targets ("/path/") render as plain links; absolute https:// targets render
// with rel="nofollow noopener" (the platform's citation convention). Every
// link carries data-prose-link, which the platform stylesheet underlines: a
// value set straight into a <div> beside other text is outside the p/li
// selectors that underline copy links, and Starter Feeding's tan link on
// taupe copy (1.16:1, no underline) failed the build gate's axe pass
// link-in-text-block (2026-10-28).
// Shipped by the platform so a page never re-types the link pattern: a
// re-typed pattern that dropped one escape printed "[label](/path/)" as
// visible text on every prose block of a page (Markdown Table Generator,
// 2026-10-06).

import type { ReactNode } from "react";

const LINK_PATTERN = /\[([^\]]{1,120})\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__/g;

export function RichText({ value }: { value: string | null | undefined }): ReactNode {
  const text = typeof value === "string" ? value : "";
  if (!text.includes("](") && !text.includes("**") && !text.includes("__")) return <>{text}</>;
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push(text.slice(cursor, index));
    if (match[1] !== undefined) {
      const href = match[2];
      parts.push(/^https?:\/\//.test(href)
        ? <a key={index} href={href} rel="nofollow noopener" data-prose-link>{match[1]}</a>
        : <a key={index} href={href} data-prose-link>{match[1]}</a>);
    } else {
      parts.push(<strong key={index}>{match[3] || match[4]}</strong>);
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
