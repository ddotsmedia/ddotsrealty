// Workaround for Next.js 16.2.9 writing an empty .next/prerender-manifest.json,
// which makes `next start` crash with "Unexpected end of JSON input".
// Runs automatically as a postbuild step.
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const file = path.join(process.cwd(), ".next", "prerender-manifest.json");

function isValid(p) {
  try {
    const raw = fs.readFileSync(p, "utf8");
    if (!raw.trim()) return false;
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

if (!fs.existsSync(file) || !isValid(file)) {
  const manifest = {
    version: 4,
    routes: {},
    dynamicRoutes: {},
    notFoundRoutes: [],
    preview: {
      previewModeId: crypto.randomBytes(16).toString("hex"),
      previewModeSigningKey: crypto.randomBytes(32).toString("hex"),
      previewModeEncryptionKey: crypto.randomBytes(32).toString("hex"),
    },
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(manifest));
  console.log("[postbuild] wrote valid prerender-manifest.json");
} else {
  console.log("[postbuild] prerender-manifest.json OK");
}
