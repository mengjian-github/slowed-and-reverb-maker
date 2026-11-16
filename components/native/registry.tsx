import type { ComponentType } from "react";

import type { Route, SiteConfig } from "@/lib/site-config";

import type { PageContent } from "../../lib/content";

import { HomePage } from "./HomePage";
import { NightcorePage } from "./NightcorePage";
import { AboutPage, ComparePage, ContactPage, GuidePage, PrivacyPage, TermsPage } from "./GuidePage";

export type NativeRouteProps = {
  route: Route;
  content: PageContent;
  config: SiteConfig;
};

export const nativeRoutes: Record<string, ComponentType<NativeRouteProps>> = {
  "/": HomePage,
  "/nightcore-maker/": NightcorePage,
  "/how-to-make-slowed-and-reverb/": GuidePage,
  "/slowed-vs-nightcore/": ComparePage,
  "/about/": AboutPage,
  "/privacy/": PrivacyPage,
  "/terms/": TermsPage,
  "/contact/": ContactPage,
};
