import { languageSwitcherLinks } from "../lib/site-config";

export function LanguageSwitcher({ path, standalone = false }: { path: string; standalone?: boolean }) {
  const links = languageSwitcherLinks(path);
  if (!links.length) return null;
  return (
    <nav className={standalone ? "locale-switcher locale-switcher-standalone" : "locale-switcher"} aria-label="Language">
      {links.map((item) => item.current
        ? <span key={item.code} className="locale-link" lang={item.code} aria-current="true">{item.label}</span>
        : <a key={item.code} className="locale-link" href={item.href} lang={item.code} hrefLang={item.code}>{item.label}</a>)}
    </nav>
  );
}
