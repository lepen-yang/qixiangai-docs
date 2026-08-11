/**
 * Build-time script: fetch release metadata from the app server
 * and write a static JSON so the docs site can import it directly.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const RELEASE_BASE = 'http://app.qixiangai.chat/releases/qixiang-studio'
const OUT_DIR = path.resolve(__dirname, '../src/.vitepress/theme')
const OUT_FILE = path.join(OUT_DIR, 'release-data.json')

const PLATFORMS = [
  {
    name: 'macOS',
    ymlFile: 'latest-mac.yml',
    items: [
      { label: 'Apple Silicon (M1/M2/M3/M4)', pattern: 'arm64' },
      { label: 'Intel', pattern: 'x64' }
    ],
    extPriority: ['.dmg', '.zip']
  },
  {
    name: 'Windows',
    ymlFile: 'latest.yml',
    items: [{ label: 'Windows 10/11 (64-bit)', pattern: 'setup' }],
    extPriority: ['.exe']
  }
]

async function fetchYml(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.text()
}

/**
 * 从匹配到的候选文件中，按扩展名优先级选出最佳文件。
 * extPriority 靠前的优先级更高；不在列表中的扩展名优先级最低。
 */
function pickBestFile(candidates, extPriority) {
  if (candidates.length === 0) return ''
  if (!extPriority || extPriority.length === 0) return candidates[0]

  const rank = (file) => {
    const lower = file.toLowerCase()
    const idx = extPriority.findIndex((ext) => lower.endsWith(ext))
    return idx === -1 ? Infinity : idx
  }

  return candidates.slice().sort((a, b) => rank(a) - rank(b))[0]
}

function parseUpdaterYml(ymlText) {
  const data = load(ymlText)
  const version = typeof data?.version === 'string' ? data.version : ''
  const files = Array.isArray(data?.files)
    ? data.files.map((f) => (typeof f?.url === 'string' ? f.url : '')).filter(Boolean)
    : []
  return { version, files }
}

async function main() {
  const resultPlatforms = []

  for (const platform of PLATFORMS) {
    const url = `${RELEASE_BASE}/${platform.ymlFile}`
    let version = ''
    let items = platform.items.map((it) => ({
      label: it.label,
      file: '',
      available: false
    }))

    try {
      const ymlText = await fetchYml(url)
      const data = parseUpdaterYml(ymlText)
      version = data.version

      const allPatterns = platform.items.map((it) => it.pattern)
      const matches = platform.items.map(() => [])
      for (const file of data.files) {
        const lower = file.toLowerCase()
        if (allPatterns.some((p) => lower.includes(p))) {
          platform.items.forEach((it, idx) => {
            if (lower.includes(it.pattern)) {
              matches[idx].push(file)
            }
          })
        }
      }
      // 按扩展名优先级为每个 item 选出最佳文件
      for (let i = 0; i < items.length; i++) {
        const best = pickBestFile(matches[i], platform.extPriority)
        if (best) {
          items[i] = {
            label: platform.items[i].label,
            file: best,
            available: true
          }
        }
      }
      console.log(`✅ ${platform.name}: v${version} — loaded ${data.files.length} files`)
    } catch (err) {
      console.warn(`⚠️  ${platform.name}: ${err.message}`)
    }

    resultPlatforms.push({
      name: platform.name,
      version,
      items
    })
  }

  const output = {
    platforms: resultPlatforms,
    fetchedAt: new Date().toISOString()
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2))
  console.log(`📝 Written to ${OUT_FILE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
