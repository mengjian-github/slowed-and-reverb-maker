"use client";

import { useEffect, useRef } from "react";

import siteConfig from "@/lib/site-config.json";
import type { SiteConfig } from "@/lib/site-config";

// The site's own chrome: a mission-console top bar for an after-hours audio
// tool. Contract kept: data-node="nav", .nav-link links, a .mobile-nav drawer
// with .mobile-nav-links, and .footer-groups in the footer.

function samePath(left: string | undefined, right: string | undefined) {
  const norm = (value: string) => ((value || "/").split(/[?#]/)[0]?.replace(/\/+$/, "") || "/");
  return norm(left) === norm(right) && !!left;
}

export function BrandMark({ height = 20 }: { height?: number }) {
  return (
    <svg viewBox="0 0 64 24" width={(height * 64) / 24} height={height} aria-hidden="true" className="brand-mark">
      <rect x="0" y="2" width="4" height="20" rx="1.5" fill="currentColor" />
      <rect x="6" y="5" width="4" height="17" rx="1.5" fill="currentColor" opacity=".88" />
      <rect x="12" y="8" width="4" height="14" rx="1.5" fill="currentColor" opacity=".76" />
      <rect x="18" y="10.5" width="4" height="11.5" rx="1.5" fill="currentColor" opacity=".64" />
      <rect x="24" y="13" width="4" height="9" rx="1.5" fill="currentColor" opacity=".54" />
      <rect x="30" y="15" width="4" height="7" rx="1.5" fill="currentColor" opacity=".46" />
      <rect x="36" y="17" width="4" height="5" rx="1.5" fill="currentColor" opacity=".4" />
      <rect x="42" y="18.5" width="4" height="3.5" rx="1.5" fill="currentColor" opacity=".34" />
      <path d="M49 18 C 53 12 58 9 63 10" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".55" />
    </svg>
  );
}

export function SiteHeader({ config = siteConfig as SiteConfig }: { config?: SiteConfig } = {}) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      bar.style.width = `${(max > 0 ? Math.min(1, doc.scrollTop / max) : 0) * 100}%`;
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const nav = config.nav ?? [];
  const groups = config.navGroups ?? [];
  const drawer = [...nav, ...groups.flatMap((group) => group.items)];
  const fmts = "MP3 · WAV · M4A · OGG · FLAC";

  return (
    <header data-chrome="site" className="site-header">
      <div className="scroll-progress" ref={progressRef} aria-hidden="true" />
      <nav data-node="nav" className="topbar">
        <a href="/" className="brand" aria-current={samePath("/", "/") ? "page" : undefined}>
          <BrandMark />
          <span className="brand-name">
            {config.brandName ?? "Slowed and Reverb Maker"}
          </span>
        </a>
        <div className="nav-links">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="nav-link" aria-current={samePath(item.href, "/") ? "page" : undefined}>
              {item.label}
            </a>
          ))}
          {groups.map((group) => (
            <details key={group.label} className="nav-group">
              <summary>{group.label}</summary>
              <div className="nav-group-links">
                {group.items.map((item) => (
                  <a key={item.href} href={item.href} className="nav-link" aria-current={samePath(item.href, "/") ? "page" : undefined}>
                    {item.label}
                  </a>
                ))}
              </div>
            </details>
          ))}
        </div>
        <div className="nav-fmts" aria-hidden="true">{fmts}</div>
        <details className="mobile-nav">
          <summary aria-label="Open navigation">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 6h14M3 10h14M3 14h14" />
            </svg>
          </summary>
          <div className="mobile-nav-links">
            {drawer.map((item) => (
              <a key={item.href} href={item.href} className="nav-link" aria-current={samePath(item.href, "/") ? "page" : undefined}>
                {item.label}
              </a>
            ))}
            <span className="mobile-nav-fmts">{fmts}</span>
          </div>
        </details>
      </nav>
    </header>
  );
}

export function SiteFooter({ config = siteConfig as SiteConfig }: { config?: SiteConfig } = {}) {
  const groups = config.footerGroups ?? [];
  return (
    <footer data-node="footer" data-chrome="site" className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-row">
          <BrandMark height={16} />
          <span className="footer-brand">{config.brandName ?? "Slowed and Reverb Maker"}</span>
          <span className="footer-tagline">Let the last chorus drift.</span>
        </div>
        {groups.length ? (
          <div className="footer-groups">
            {groups.map((group) => (
              <nav key={group.title} className="footer-group" aria-label={group.title}>
                <div className="footer-group-title">{group.title}</div>
                {group.links.map((item) => (
                  <a key={item.href} href={item.href}>{item.label}</a>
                ))}
              </nav>
            ))}
          </div>
        ) : (
          <nav className="footer-nav">
            {(config.nav ?? []).map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </nav>
        )}
        {config.footerNote ? <p className="footer-note">{config.footerNote}</p> : null}
        {config.contactEmail ? (
          <p className="footer-contact">
            <a href={"mailto:" + config.contactEmail}>{config.contactEmail}</a>
          </p>
        ) : null}
        <p className="footer-legal">Processing runs in your browser. Your audio files never leave your device.</p>
      </div>
    </footer>
  );
}
