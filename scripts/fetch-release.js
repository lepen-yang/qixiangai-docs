/**
 * Build-time script: fetch release metadata from the app server
 * and write a static JSON so the docs site can import it directly.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RELEASE_BASE = "http://app.qixiangai.chat/releases/qixiang-studio";
const OUT_DIR = path.resolve(__dirname, "../src/.vitepress/theme");
const OUT_FILE = path.join(OUT_DIR, "release-data.json");

const PLATFORMS = [
  {
    name: "macOS",
    ymlFile: "latest-mac.yml",
    items: [
      { label: "Apple Silicon (M1/M2/M3/M4)", pattern: "arm64" },
      { label: "Intel", pattern: "x64" },
    ],
  },
  {
    name: "Windows",
    ymlFile: "latest.yml",
    items: [{ label: "Windows 10/11 (64-bit)", pattern: "setup" }],
  },
];

async function fetchYml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function parseUpdaterYml(ymlText) {
  const data = load(ymlText);
  const version = typeof data?.version === "string" ? data.version : "";
  const files = Array.isArray(data?.files)
    ? data.files
        .map((f) => (typeof f?.url === "string" ? f.url : ""))
        .filter(Boolean)
    : [];
  return { version, files };
}

async function main() {
  const resultPlatforms = [];

  for (const platform of PLATFORMS) {
    const url = `${RELEASE_BASE}/${platform.ymlFile}`;
    let version = "";
    let items = platform.items.map((it) => ({
      label: it.label,
      file: "",
      available: false,
    }));

    try {
      const ymlText = await fetchYml(url);
      const data = parseUpdaterYml(ymlText);
      version = data.version;

      for (const file of data.files) {
        const lower = file.toLowerCase();
        const idx = platform.items.findIndex((it) =>
          lower.includes(it.pattern),
        );
        if (idx > -1) {
          items[idx] = {
            label: platform.items[idx].label,
            file,
            available: true,
          };
        }
      }
      console.log(`✅ ${platform.name}: v${version} — loaded ${data.files.length} files`);
    } catch (err) {
      console.warn(`⚠️  ${platform.name}: ${err.message}`);
    }

    resultPlatforms.push({
      name: platform.name,
      version,
      items,
    });
  }

  const output = {
    platforms: resultPlatforms,
    fetchedAt: new Date().toISOString(),
  };

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`📝 Written to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
