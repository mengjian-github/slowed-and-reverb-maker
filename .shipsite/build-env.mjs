import { readFileSync, appendFileSync } from "node:fs";
const receipt = JSON.parse(readFileSync(".shipsite/source.json", "utf8"));
if (receipt.contract !== "shipsite.owner-source.v1"
  || !receipt.projectId || receipt.projectId !== process.env.SHIPSITE_PROJECT_ID
  || !/^ver_[A-Za-z0-9_-]{1,100}$/.test(receipt.versionId ?? "")
  || !/^[a-f0-9]{64}$/.test(receipt.sourceSha256 ?? "")
  || receipt.sourceSha256 !== process.env.SHIPSITE_SOURCE_SHA256
  || !process.env.GITHUB_ENV) throw new Error("owner_build_identity_mismatch");
appendFileSync(process.env.GITHUB_ENV, "NEXT_PUBLIC_SHIPSITE_VERSION_ID=" + receipt.versionId + "\nNEXT_PUBLIC_BUILD_ENV=preview\n");
