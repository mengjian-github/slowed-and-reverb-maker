// Art media — how a picture is composed into the page, the way a designer
// places it, never a rectangle dropped beside text (owner review 2026-11-05:
// every picture read as "forced in"). Each asset in the design carries its
// treatment; pass it straight through. Server-safe: no state, no effects.
// The look lives in the platform stylesheet (.art-*), painted in the site's
// own tokens, so every site gets the craft in its own colours.
// Exports: ArtMedia, ArtFloat, ArtWall.
// Usage:
//   <ArtMedia treatment="backdrop" src="/images/dj-mid-set.webp" alt="...">
//     <h1>...</h1><p>...</p>            // copy sits over the picture behind a scrim
//   </ArtMedia>
//   <ArtMedia treatment="masked" shape="arch" src="/images/a.webp" alt="..." />
//   <ArtMedia treatment="cutout" src="/images/b.webp" alt="..." />   // stands in front, breaks the edge
//   <ArtMedia treatment="collage" src="/images/c.webp" alt="...">
//     <span>8A · C minor</span>          // a fragment of the tool's own UI or a result chip
//   </ArtMedia>
//   <ArtMedia treatment="framed" src="/images/d.webp" alt="..." caption="..." />
//   <ArtMedia treatment="spot" src="/images/e.webp" alt="" />        // small illustration beside a step
//   <ArtFloat images={[{ src, alt }, { src, alt }]}><ToolCard ... /></ArtFloat>  // tilted cards drift around the centre
//   <ArtWall images={[{ src, alt }, ...]} />                                     // perspective wall of tiles
// Rules: one treatment per picture, as the design declared it; neighbouring
//   sections use different treatments; text over a backdrop goes in children.

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ArtTreatment = "backdrop" | "masked" | "cutout" | "float" | "collage" | "wall" | "framed" | "spot";
export type ArtShape = "arch" | "circle" | "slant" | "blob";

export interface ArtMediaProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  treatment: ArtTreatment;
  src: string;
  alt: string;
  /** Mask shape for treatment="masked". */
  shape?: ArtShape;
  /** Reader-facing caption (framed). */
  caption?: ReactNode;
  /** backdrop: the copy over the picture. collage: the UI fragment or chip layered on it. */
  children?: ReactNode;
  /** The first screen's picture: loads eagerly. */
  priority?: boolean;
}

function Img({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />;
}

export function ArtMedia({ treatment, src, alt, shape, caption, children, priority, className, ...props }: ArtMediaProps) {
  if (treatment === "backdrop") {
    return (
      <div data-art="backdrop" className={cn("art art-backdrop", className)} {...props}>
        <div className="art-backdrop-media" aria-hidden={alt ? undefined : true}><Img src={src} alt={alt} priority={priority} /></div>
        {children ? <div className="art-backdrop-content">{children}</div> : null}
      </div>
    );
  }
  if (treatment === "collage") {
    return (
      <figure data-art="collage" className={cn("art art-collage", className)} {...props}>
        <Img src={src} alt={alt} priority={priority} />
        {children ? <div className="art-collage-chip">{children}</div> : null}
      </figure>
    );
  }
  const treatmentClass = treatment === "float" || treatment === "wall" ? "framed" : treatment;
  return (
    <figure data-art={treatmentClass} data-shape={treatment === "masked" ? shape ?? "arch" : undefined}
      className={cn("art", `art-${treatmentClass}`, className)} {...props}>
      <Img src={src} alt={alt} priority={priority} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export interface ArtFloatProps extends HTMLAttributes<HTMLDivElement> {
  images: { src: string; alt: string }[];
  /** The centre the cards drift around: the tool card, the headline, an input. */
  children: ReactNode;
}

export function ArtFloat({ images, children, className, ...props }: ArtFloatProps) {
  return (
    <div data-art="float" className={cn("art art-float", className)} {...props}>
      {images.slice(0, 4).map((image, index) => (
        <figure key={index} className="art-float-card" data-slot={index} aria-hidden={image.alt ? undefined : true}>
          <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
        </figure>
      ))}
      <div className="art-float-centre">{children}</div>
    </div>
  );
}

export interface ArtWallProps extends HTMLAttributes<HTMLDivElement> {
  images: { src: string; alt: string; caption?: ReactNode }[];
}

export function ArtWall({ images, className, ...props }: ArtWallProps) {
  return (
    <div data-art="wall" className={cn("art art-wall", className)} {...props}>
      <div className="art-wall-plane">
        {images.slice(0, 9).map((image) => (
          <figure key={image.src} className="art-wall-tile">
            <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </div>
  );
}
