import { isPreviewDeployment } from "../lib/site-config";

// The site's own runtime script, served from this site's origin
// (public/__shipsite/runtime.js). A generated site loads nothing from the
// platform that built it. data-accounts says whether the site's own Worker
// signs visitors in (filled at build from the backend contract).
export function ShipsiteRuntime() {
  return <script defer src="/__shipsite/runtime.js" data-project="prj_d2592157-71b" data-accounts="false" data-preview={isPreviewDeployment() ? "true" : "false"} />;
}
