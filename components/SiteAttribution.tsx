import { siteConfig } from "../lib/site-config";

export function SiteAttribution({ standalone = false }: { standalone?: boolean }) {
  const zh = (siteConfig.language || "").toLowerCase().startsWith("zh");
  return (
    <p className={standalone ? "footer-attribution footer-attribution-standalone" : "footer-attribution"}>
      <a href="https://shipsite.ai?utm_source=site-badge&utm_medium=footer" target="_blank" rel="noopener">{zh ? "由 ShipSite 构建" : "Made with ShipSite.ai"}</a>
    </p>
  );
}
