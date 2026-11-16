// Pinned YouTube mount. Authored JSX cannot emit <iframe> (js-admission
// inline_embed); this module is the only sanctioned way to put a video on
// a generated page. Only youtube-nocookie.com embed URLs render.

import { youtubeEmbedSrc } from "@/lib/content";

export function VideoEmbed({ src, title }: { src: string; title?: string }) {
  const embed = youtubeEmbedSrc(src);
  if (!embed) return null;
  return (
    <figure className="media video-embed" data-provider="youtube">
      <iframe
        src={embed}
        title={title || "Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </figure>
  );
}
