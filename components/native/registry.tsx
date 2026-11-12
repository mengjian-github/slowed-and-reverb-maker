import type { ComponentType } from "react";

import type { Route, SiteConfig } from "@/lib/site-config";

import type { PageContent } from "../../lib/content";

import HomePage from "./HomePage";
import FrozenCopyPage from "./FrozenCopyPage";
import NightcoreMakerPage from "./NightcoreMakerPage";

// AUTO-COMPOSED by the per-route native authoring pass — entries are
// merged per route from each accepted patch; hand edits are overwritten.
// An unregistered route renders the deterministic composition.

export type NativeRouteProps = {
  route: Route;
  content: PageContent;
  config: SiteConfig;
};

export const nativeRoutes: Record<string, ComponentType<NativeRouteProps>> = {
  "/": HomePage,
  "/about/": FrozenCopyPage,
  "/contact/": FrozenCopyPage,
  "/how-to-make-slowed-and-reverb/": FrozenCopyPage,
  "/nightcore-maker/": NightcoreMakerPage,
  "/privacy/": FrozenCopyPage,
  "/slowed-vs-nightcore/": FrozenCopyPage,
  "/terms/": FrozenCopyPage,
};

