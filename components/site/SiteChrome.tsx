"use client";

import { usePathname } from "next/navigation";
import { siteConfig, type SiteConfig } from "@/lib/site-config";

const MOTION_RUNTIME_SCRIPT = "(function () {\n  \"use strict\";\n  if (window.__shipsiteMotion) return;\n  window.__shipsiteMotion = true;\n  var reduced = window.matchMedia && window.matchMedia(\"(prefers-reduced-motion: reduce)\").matches;\n  // Authored CSS keys its own resting state on .revealed\n  // ([data-motion=\"scroll-reveal\"]:not(.revealed) { opacity: 0 }), but the\n  // class only came from the no-view() fallback, so in Chrome Key Finder's\n  // example answer card stayed transparent on the first screen forever\n  // (2026-11-10). Every scroll-reveal element now gets .revealed as it is\n  // seen, in every browser, and at once under reduced motion or without an\n  // observer.\n  function revealAll() {\n    var nodes = document.querySelectorAll('[data-motion=\"scroll-reveal\"]');\n    for (var i = 0; i < nodes.length; i++) nodes[i].classList.add(\"revealed\");\n  }\n  if (reduced || !(\"IntersectionObserver\" in window)) {\n    revealAll();\n    window.addEventListener(\"load\", revealAll);\n    return;\n  }\n\n  var timelineSupported = false;\n  try {\n    timelineSupported = window.CSS && CSS.supports && CSS.supports(\"animation-timeline: view()\");\n  } catch (e) { timelineSupported = false; }\n\n  var revealed = new IntersectionObserver(function (entries) {\n    for (var i = 0; i < entries.length; i++) {\n      if (!entries[i].isIntersecting) continue;\n      entries[i].target.classList.add(\"revealed\");\n      revealed.unobserve(entries[i].target);\n    }\n  }, { rootMargin: \"0px 0px -8% 0px\", threshold: 0.08 });\n\n  // Seen at threshold 0, so a card taller than the screen or one only partly\n  // in the first view still counts.\n  var seen = new IntersectionObserver(function (entries) {\n    for (var i = 0; i < entries.length; i++) {\n      if (!entries[i].isIntersecting) continue;\n      entries[i].target.classList.add(\"revealed\");\n      seen.unobserve(entries[i].target);\n    }\n  }, { threshold: 0 });\n  function armSeen(scope) {\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"scroll-reveal\"]:not(.revealed)');\n    for (var i = 0; i < nodes.length; i++) seen.observe(nodes[i]);\n  }\n\n  var revealEngaged = false;\n  function armFallback(scope) {\n    if (timelineSupported) return;\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"scroll-reveal\"]:not(.revealed):not(.motion-armed)');\n    for (var i = 0; i < nodes.length; i++) {\n      var node = nodes[i];\n      var box = node.getBoundingClientRect();\n      if (box.top < window.innerHeight * 0.92 && box.bottom > 0) {\n        node.classList.add(\"revealed\");\n        continue;\n      }\n      node.classList.add(\"motion-armed\");\n      revealed.observe(node);\n    }\n  }\n  function engageReveals() {\n    if (revealEngaged) return;\n    if ((window.scrollY || window.pageYOffset || 0) <= 0) return;\n    revealEngaged = true;\n    document.documentElement.classList.add(\"motion-scrolled\");\n    armFallback(document);\n  }\n  function armReveals(scope) {\n    if (!revealEngaged) return;\n    armFallback(scope);\n  }\n  window.addEventListener(\"scroll\", engageReveals, { passive: true });\n  engageReveals();\n\n  function armStagger(scope) {\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"stagger-reveal\"]:not(.stagger-armed)');\n    for (var i = 0; i < nodes.length; i++) {\n      var node = nodes[i];\n      var box = node.getBoundingClientRect();\n      if (box.top < window.innerHeight * 0.9) continue;\n      node.classList.add(\"stagger-armed\");\n      revealed.observe(node);\n    }\n  }\n\n  function rollCount(node) {\n    if (node.__counted) return;\n    node.__counted = true;\n    var targets = node.classList.contains(\"status-count\")\n      ? [node]\n      : node.querySelectorAll(\".status-count\");\n    for (var i = 0; i < targets.length; i++) {\n      var el = targets[i];\n      var final = parseFloat(String(el.textContent).replace(/[^0-9.]/g, \"\"));\n      if (!isFinite(final) || final <= 0) continue;\n      var start = null;\n      function step(ts) {\n        if (start === null) start = ts;\n        var t = Math.min((ts - start) / 900, 1);\n        el.textContent = String(Math.round(final * (1 - Math.pow(1 - t, 3))));\n        if (t < 1) requestAnimationFrame(step);\n      }\n      requestAnimationFrame(step);\n    }\n  }\n\n  var counted = new IntersectionObserver(function (entries) {\n    for (var i = 0; i < entries.length; i++) {\n      if (entries[i].isIntersecting) { rollCount(entries[i].target); counted.unobserve(entries[i].target); }\n    }\n  }, { threshold: 0.4 });\n\n  function armCounts(scope) {\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"count-up\"]');\n    for (var i = 0; i < nodes.length; i++) counted.observe(nodes[i]);\n  }\n\n  // tilt-glare: pointer position → CSS variables. Fine pointers only; the\n  // CSS springs the card back when .tilting drops on leave.\n  var finePointer = window.matchMedia && window.matchMedia(\"(pointer: fine)\").matches;\n  function armTilts(scope) {\n    if (!finePointer) return;\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"tilt-glare\"]');\n    for (var i = 0; i < nodes.length; i++) {\n      var node = nodes[i];\n      if (node.__tilt) continue;\n      node.__tilt = true;\n      node.addEventListener(\"pointermove\", function (event) {\n        var el = event.currentTarget;\n        var box = el.getBoundingClientRect();\n        var x = (event.clientX - box.left) / Math.max(box.width, 1);\n        var y = (event.clientY - box.top) / Math.max(box.height, 1);\n        el.style.setProperty(\"--tilt-x\", ((x - 0.5) * 12).toFixed(2) + \"deg\");\n        el.style.setProperty(\"--tilt-y\", ((0.5 - y) * 12).toFixed(2) + \"deg\");\n        el.style.setProperty(\"--glare-x\", Math.round(x * 100) + \"%\");\n        el.style.setProperty(\"--glare-y\", Math.round(y * 100) + \"%\");\n        el.classList.add(\"tilting\");\n      });\n      node.addEventListener(\"pointerleave\", function (event) {\n        var el = event.currentTarget;\n        el.classList.remove(\"tilting\");\n        el.style.setProperty(\"--tilt-x\", \"0deg\");\n        el.style.setProperty(\"--tilt-y\", \"0deg\");\n      });\n    }\n  }\n\n  // value-tick: the text is already the new value; replay the roll class.\n  function armTicks(scope) {\n    if (!(\"MutationObserver\" in window)) return;\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"value-tick\"]');\n    for (var i = 0; i < nodes.length; i++) {\n      var node = nodes[i];\n      if (node.__tick) continue;\n      node.__tick = true;\n      new MutationObserver(function (records) {\n        var el = records[0].target.nodeType === 1 ? records[0].target : records[0].target.parentElement;\n        while (el && el.getAttribute && el.getAttribute(\"data-motion\") !== \"value-tick\") el = el.parentElement;\n        if (!el) return;\n        el.classList.remove(\"ticked\");\n        void el.offsetWidth;\n        el.classList.add(\"ticked\");\n      }).observe(node, { childList: true, characterData: true, subtree: true });\n    }\n  }\n\n  // Every tool's answer settles in when it changes, whether or not the\n  // authored page set value-tick on it: a silent swap reads as nothing\n  // happened. The Web Animations API touches no attribute or text node React\n  // renders, so React keeps owning the output.\n  var settled = \"MutationObserver\" in window ? new MutationObserver(function (records) {\n    var seen = [];\n    for (var i = 0; i < records.length; i++) {\n      var node = records[i].target.nodeType === 1 ? records[i].target : records[i].target.parentElement;\n      var out = node && node.closest ? node.closest(\"[data-tool-output]\") : null;\n      if (!out || seen.indexOf(out) >= 0 || !out.animate) continue;\n      seen.push(out);\n      if (out.querySelector('[data-motion=\"value-tick\"]') || out.getAttribute(\"data-motion\") === \"value-tick\") continue;\n      out.animate([{ opacity: 0.35, transform: \"translateY(4px)\" }, { opacity: 1, transform: \"none\" }], { duration: 240, easing: \"cubic-bezier(0.23, 1, 0.32, 1)\" });\n    }\n  }) : null;\n  function armOutputs(scope) {\n    if (!settled) return;\n    var nodes = (scope || document).querySelectorAll(\"[data-tool-output]\");\n    for (var i = 0; i < nodes.length; i++) {\n      if (nodes[i].__settle) continue;\n      nodes[i].__settle = true;\n      settled.observe(nodes[i], { childList: true, characterData: true, subtree: true });\n    }\n  }\n\n  // line-reveal / draw-on: arm only what is below the first screen, so the\n  // first frame never hides; draw-on measures each stroke for its dash.\n  // Own observer at threshold 0: an armed heading is clipped to a 1% sliver,\n  // and a ratio threshold never fires on a clipped target (the heading stayed\n  // hidden in the first browser check).\n  var drawn = new IntersectionObserver(function (entries) {\n    for (var i = 0; i < entries.length; i++) {\n      if (!entries[i].isIntersecting) continue;\n      entries[i].target.classList.add(\"revealed\");\n      drawn.unobserve(entries[i].target);\n    }\n  }, { rootMargin: \"0px 0px -8% 0px\", threshold: 0 });\n  function armDrawn(scope) {\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"line-reveal\"]:not(.motion-armed), [data-motion=\"draw-on\"]:not(.motion-armed)');\n    for (var i = 0; i < nodes.length; i++) {\n      var node = nodes[i];\n      if (node.getBoundingClientRect().top < window.innerHeight * 0.9) continue;\n      if (node.getAttribute(\"data-motion\") === \"draw-on\") {\n        var strokes = node.querySelectorAll(\"path, line, polyline, polygon, rect, circle, ellipse\");\n        for (var j = 0; j < strokes.length; j++) {\n          var length = 0;\n          try { length = strokes[j].getTotalLength ? strokes[j].getTotalLength() : 0; } catch (e) { length = 0; }\n          if (length > 0) strokes[j].style.setProperty(\"--draw-len\", String(Math.ceil(length)));\n        }\n      }\n      node.classList.add(\"motion-armed\");\n      drawn.observe(node);\n    }\n  }\n\n  // flip-list: when a sorted or filtered list reorders, every surviving item\n  // glides from where it was to where it is (GSAP Flip's First-Last-Invert-\n  // Play, without the library). React moves the same keyed nodes, so the\n  // runtime keeps each child's offset inside its container and, the moment a\n  // mutation lands, animates the difference with Web Animations — no attribute\n  // or text write, so React keeps owning the list. New items fade in.\n  var flipPositions = typeof WeakMap === \"function\" ? new WeakMap() : null;\n  function measureFlip(list) {\n    var base = list.getBoundingClientRect();\n    for (var i = 0; i < list.children.length; i++) {\n      var box = list.children[i].getBoundingClientRect();\n      flipPositions.set(list.children[i], { x: box.left - base.left, y: box.top - base.top });\n    }\n  }\n  function playFlip(list) {\n    var base = list.getBoundingClientRect();\n    for (var i = 0; i < list.children.length; i++) {\n      var child = list.children[i];\n      if (!child.animate) continue;\n      var box = child.getBoundingClientRect();\n      var before = flipPositions.get(child);\n      if (!before) {\n        child.animate([{ opacity: 0, transform: \"scale(0.97)\" }, { opacity: 1, transform: \"none\" }], { duration: 260, easing: \"cubic-bezier(0.23, 1, 0.32, 1)\" });\n        continue;\n      }\n      var dx = before.x - (box.left - base.left);\n      var dy = before.y - (box.top - base.top);\n      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;\n      child.animate([{ transform: \"translate(\" + dx + \"px, \" + dy + \"px)\" }, { transform: \"none\" }], { duration: 360, easing: \"cubic-bezier(0.23, 1, 0.32, 1)\" });\n    }\n    measureFlip(list);\n  }\n  function armFlips(scope) {\n    if (!flipPositions || !(\"MutationObserver\" in window)) return;\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"flip-list\"]');\n    for (var i = 0; i < nodes.length; i++) {\n      var list = nodes[i];\n      if (list.__flip) continue;\n      list.__flip = true;\n      measureFlip(list);\n      new MutationObserver(function (records) { playFlip(records[0].target); }).observe(list, { childList: true });\n    }\n  }\n  var flipResize = null;\n  window.addEventListener(\"resize\", function () {\n    clearTimeout(flipResize);\n    flipResize = setTimeout(function () {\n      var lists = document.querySelectorAll('[data-motion=\"flip-list\"]');\n      for (var i = 0; i < lists.length; i++) if (lists[i].__flip) measureFlip(lists[i]);\n    }, 150);\n  });\n\n  // step-track: scroll storytelling without pinning. The step crossing the\n  // middle of the screen is marked active and the track beside the list fills\n  // to it (ScrollTrigger scrub's feel). No step is ever dimmed: every step\n  // stays at full contrast, the active one only gains an accent rule.\n  function armSteps(scope) {\n    var nodes = (scope || document).querySelectorAll('[data-motion=\"step-track\"]:not(.steps-armed)');\n    for (var i = 0; i < nodes.length; i++) {\n      var track = nodes[i];\n      track.classList.add(\"steps-armed\");\n      var steps = track.querySelectorAll(\":scope > li, :scope > [data-step]\");\n      if (!steps.length) continue;\n      (function (track, steps) {\n        var watcher = new IntersectionObserver(function (entries) {\n          for (var k = 0; k < entries.length; k++) {\n            if (!entries[k].isIntersecting) continue;\n            var index = Array.prototype.indexOf.call(steps, entries[k].target);\n            for (var s = 0; s < steps.length; s++) steps[s].classList.toggle(\"step-active\", s === index);\n            track.style.setProperty(\"--step-progress\", String((index + 1) / steps.length));\n          }\n        }, { rootMargin: \"-45% 0px -45% 0px\", threshold: 0 });\n        for (var s = 0; s < steps.length; s++) watcher.observe(steps[s]);\n      })(track, steps);\n    }\n  }\n\n  function arm(scope) { armSeen(scope); armReveals(scope); armStagger(scope); armCounts(scope); armTilts(scope); armTicks(scope); armOutputs(scope); armDrawn(scope); armFlips(scope); armSteps(scope); }\n  arm(document);\n\n  // Preview/runtime surfaces that swap DOM after load (tool shells, accordions)\n  // get one late pass instead of a MutationObserver tax on every page.\n  window.addEventListener(\"load\", function () { arm(document); });\n})();";

function samePath(left: string | undefined, right: string | undefined): boolean {
  const norm = (value: string) => {
    const trimmed = (value || "/").split(/[?#]/)[0] || "/";
    const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return withSlash.replace(/\/+$/, "") || "/";
  };
  return norm(left || "") === norm(right || "");
}

function pathWithoutLocale(pathname: string, locales: Array<{ code?: string }>): string {
  const parts = pathname.split("/").filter(Boolean);
  const code = parts[0];
  if (!code || !locales.some((locale) => locale.code === code)) return pathname;
  return `/${parts.slice(1).join("/")}` || "/";
}

// Every prop is optional: authored pages render <SiteHeader /> with whatever
// subset they have, and a required prop they left out failed the whole
// build (Dog Age Calculator: TS2741 "config"/"locales" missing, 2026-10-05).
export function SiteHeader({
  config = siteConfig,
  locales,
  currentLocale,
  currentPath,
}: {
  config?: SiteConfig;
  locales?: unknown[];
  currentLocale?: string;
  currentPath?: string;
} = {}) {
  const localeList = (Array.isArray(locales) ? locales : config.locales ?? []) as Array<{ code?: string; label?: string }>;
  const pathname = usePathname();
  // Own the current path. Native interiors routinely omit currentPath, and
  // defaulting the miss to "/" made every inner page look like home
  // (chrome:nav:missing-current-page, 2026-08-22).
  const path = currentPath || pathWithoutLocale(pathname || "/", localeList) || "/";
  const drawer = [
    ...(config.nav ?? []),
    ...(config.navGroups ?? []).flatMap((group) => group.items),
  ];
  return (
    <header data-chrome="site">
      <script dangerouslySetInnerHTML={{ __html: MOTION_RUNTIME_SCRIPT }} />
      <nav data-node="nav">
        <a href="/" className="brand" aria-current={samePath("/", path) ? "page" : undefined}>
          {config.brandLogo ? <img src={config.brandLogo} alt={config.brandName} className="brand-logo" /> : null}
          <span className="brand-wordmark">{config.brandName}</span>
        </a>
        <div className="nav-links">
          {(config.nav ?? []).map((item) => (
            <a key={item.href} href={item.href} className="nav-link" aria-current={samePath(item.href, path) ? "page" : undefined}>{item.label}</a>
          ))}
          {(config.navGroups ?? []).map((group) => (
            <details key={group.label} className="nav-group">
              <summary>{group.label}</summary>
              <div className="nav-group-links">
                {group.items.map((item) => (
                  <a key={item.href} href={item.href} className="nav-link" aria-current={samePath(item.href, path) ? "page" : undefined}>{item.label}</a>
                ))}
              </div>
            </details>
          ))}
        </div>
        <details className="mobile-nav">
          <summary aria-label="Open navigation"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h14M3 10h14M3 14h14" /></svg></summary>
          <div className="mobile-nav-links">
            {drawer.map((item) => (
              <a key={item.href} href={item.href} className="nav-link" aria-current={samePath(item.href, path) ? "page" : undefined}>{item.label}</a>
            ))}
            {config.runtimeRequirements?.requiresAuth ? (
              <button type="button" className="nav-link" data-shipsite-google-login aria-label="Sign in with Google">Sign in</button>
            ) : null}
          </div>
        </details>
        <div className="nav-actions">
          {localeList.length ? (
            <nav className="locale-switcher" aria-label="Language">
              {localeList.map((locale) => (
                <a key={locale.code || "default"} href={locale.code ? `/${locale.code}/` : "/"} aria-current={locale.code === currentLocale ? "page" : undefined}>
                  {locale.label || locale.code || "Language"}
                </a>
              ))}
            </nav>
          ) : null}
          {config.runtimeRequirements?.requiresAuth ? (
            <button type="button" className="nav-link" data-shipsite-google-login aria-label="Sign in with Google">Sign in</button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter({ config = siteConfig }: { config?: SiteConfig } = {}) {
  const groups = config.footerGroups ?? [];
  return (
    <footer data-node="footer" data-chrome="site">
      {groups.length ? (
        <div className="footer-groups">
          {groups.map((group) => (
            <nav key={group.title} className="footer-group" aria-label={group.title}>
              {group.title ? <div className="footer-group-title">{group.title}</div> : null}
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
      {config.contactEmail ? <p className="footer-contact"><a href={"mailto:" + config.contactEmail}>{config.contactEmail}</a></p> : null}
      <p className="footer-brand">{config.brandName}</p>
    </footer>
  );
}
