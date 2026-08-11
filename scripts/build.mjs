/**
 * 构建 + 部署脚本
 *
 * 1. 拉取发布元数据
 * 2. 构建 VitePress 站点
 * 3. 上传到阿里云 OSS
 *
 * 用法：
 *   node scripts/build.mjs               # 构建并部署
 *   node scripts/build.mjs --skip-deploy # 仅构建，跳过部署
 */

import OSS from 'ali-oss'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import dotenv from 'dotenv'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST_DIR = path.join(ROOT, 'src', '.vitepress', 'dist')

// ─── 颜色输出 ──────────────────────────────────────────────────────────────────

const GREEN = '\x1b[32m'
const CYAN = '\x1b[36m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

const info = (msg) => console.log(`${CYAN}ℹ️  ${msg}${RESET}`)
const ok = (msg) => console.log(`${GREEN}✅ ${msg}${RESET}`)
const warn = (msg) => console.warn(`${YELLOW}⚠️  ${msg}${RESET}`)
const fail = (msg) => {
  console.error(`${RED}❌ ${msg}${RESET}`)
  process.exit(1)
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function run(command, opts = {}) {
  return new Promise((resolve, reject) => {
    const { cwd, env } = opts
    const child = spawn(command, {
      cwd,
      env: { ...process.env, ...env },
      shell: true,
      stdio: 'inherit'
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`命令退出码 ${code}: ${command}`))
    })
  })
}

// ─── 加载环境变量 ──────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env')

  if (!fs.existsSync(envPath)) {
    warn('未找到 .env 文件，将使用系统环境变量')
    return
  }

  const result = dotenv.config({ path: envPath })

  if (result.error) {
    warn(`加载 .env 失败：${result.error.message}`)
  }
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) fail(`缺少环境变量：${name}`)
  return value
}

function collectFiles(dir, base = dir) {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, base))
    } else {
      results.push({ localPath: fullPath, relativePath: path.relative(base, fullPath) })
    }
  }
  return results
}

// ─── 主流程 ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. 拉取发布元数据
  console.log('🌐 拉取发布元数据 ...')

  // 2. 构建 VitePress 站点
  console.log('🏗️  构建 VitePress 站点 ...')
  await run('npm run build', {
    cwd: ROOT,
    env: { VITE_POSTHOG_KEY: requireEnv('VITE_POSTHOG_KEY') || '' }
  })
  ok('构建完成')

  console.log('')
  console.log('🚀 部署文档站点到阿里云 OSS')
  console.log('═══════════════════════════════════════════════════════════════')

  if (!fs.existsSync(DIST_DIR)) {
    fail(`构建产物不存在：${DIST_DIR}`)
  }

  const files = collectFiles(DIST_DIR)
  if (files.length === 0) {
    fail(`${DIST_DIR} 为空，没有可上传文件`)
  }

  info(`待上传文件数：${files.length}`)

  const client = new OSS({
    region: requireEnv('OSS_REGION'),
    bucket: requireEnv('OSS_BUCKET'),
    endpoint: requireEnv('OSS_ENDPOINT'),
    cname: true,
    accessKeyId: requireEnv('OSS_ACCESS_KEY_ID'),
    accessKeySecret: requireEnv('OSS_ACCESS_KEY_SECRET'),
    timeout: 120000
  })

  let uploaded = 0
  let totalSize = 0

  for (const file of files) {
    const ossKey = `${file.relativePath}`.replace(/\\/g, '/')
    const stat = fs.statSync(file.localPath)
    totalSize += stat.size

    const headers = {
      'Cache-Control': file.relativePath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000'
    }

    process.stdout.write(`${CYAN}⬆️  ${file.relativePath} ...${RESET}`)

    if (stat.size > 10 * 1024 * 1024) {
      await client.multipartUpload(ossKey, file.localPath, {
        headers,
        progress: (p) =>
          process.stdout.write(
            `\r${CYAN}⬆️  ${file.relativePath} ... ${Math.round(p * 100)}%${RESET}`
          )
      })
    } else {
      await client.put(ossKey, file.localPath, { headers })
    }

    process.stdout.write(
      `\r${GREEN}✅ ${file.relativePath} (${(stat.size / 1024).toFixed(1)} KB)${' '.repeat(20)}\n`
    )
    uploaded++
  }

  console.log('')
  console.log(`${GREEN}🎉 部署完成${RESET}`)
  console.log(`   ${CYAN}上传文件数：${uploaded}${RESET}`)
  console.log(`   ${CYAN}总大小：${(totalSize / 1024 / 1024).toFixed(1)} MB${RESET}`)
}

loadEnv()

main().catch((err) => fail(err.message))
