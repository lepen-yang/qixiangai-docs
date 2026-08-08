<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface StatItem {
  value: number
  suffix: string
  label: string
  icon: string
}

// ── 下载量动态计算 ──────────────────────────────────────
const LAUNCH_DATE = '2026-07-15'
const LAUNCH_DOWNLOADS = 2627
const DAILY_DOWNLOAD_RATE = 32

function calcDownloads(): number {
  const now = new Date()
  const launch = new Date(LAUNCH_DATE)
  const diffDays = Math.max(0, (now.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24))
  return Math.round(LAUNCH_DOWNLOADS + diffDays * DAILY_DOWNLOAD_RATE)
}

function formatDownloadCount(n: number): string {
  if (n >= 10000) {
    return (n / 10000).toFixed(1).replace(/\.0$/, '') + ' 万'
  }
  return n.toLocaleString()
}

const stats: StatItem[] = [
  {
    value: 12,
    suffix: '+',
    label: 'AI 模型接入',
    icon: '🤖',
  },
  {
    value: 45,
    suffix: '+',
    label: 'Agent 工具',
    icon: '🛠️',
  },
  {
    value: 24,
    suffix: '+',
    label: '画布节点类型',
    icon: '🖼️',
  },
  {
    value: 100,
    suffix: '+',
    label: '3D 模型资产',
    icon: '🎲',
  },
]

// 下载量
const downloadCount = ref(calcDownloads())
const displayDownloads = ref(0)

// 其他指标动画
const animatedValues = ref<number[]>(stats.map(() => 0))
const isVisible = ref(false)
const sectionRef = ref<HTMLElement | null>(null)
const downloadTarget = computed(() => downloadCount.value)

function animateAll() {
  if (!isVisible.value) return
  const duration = 1800
  const steps = 55
  const interval = duration / steps
  let step = 0

  const timer = setInterval(() => {
    step++
    const progress = easeOutQuart(step / steps)

    animatedValues.value = stats.map((s) => Math.round(s.value * progress))
    displayDownloads.value = Math.round(downloadTarget.value * progress)

    if (step >= steps) clearInterval(timer)
  }, interval)
}

function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4)
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  downloadCount.value = calcDownloads()

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true
          animateAll()
        }
      })
    },
    { threshold: 0.2 }
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div ref="sectionRef" class="stats-section">
    <div class="stats-bg">
      <div class="stats-glow stats-glow--left"></div>
      <div class="stats-glow stats-glow--right"></div>
    </div>
    <div class="stats-container">
      <!-- 横向指标行 -->
      <div class="stats-row">
        <div v-for="(stat, index) in stats" :key="stat.label" class="stats-item"
          :style="{ '--delay': `${index * 0.08}s` }">
          <span class="stats-item-icon">{{ stat.icon }}</span>
          <span class="stats-item-value">{{ animatedValues[index] }}</span>
          <span class="stats-item-suffix">{{ stat.suffix }}</span>
          <span class="stats-item-label">{{ stat.label }}</span>
        </div>
      </div>

      <!-- 下载量 -->
      <div class="stats-download" :style="{ '--delay': '0.4s' }">
        <div class="stats-download-decor">
          <svg class="stats-download-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 4v12m0 0l-5-5m5 5l5-5" />
            <path d="M4 20h16" />
          </svg>
          <span class="stats-download-number">{{ formatDownloadCount(displayDownloads) }}</span>
          <span class="stats-download-plus">+</span>
          <span class="stats-download-text">累计下载用户</span>
        </div>
        <div class="stats-download-sub">自 {{ LAUNCH_DATE }} 发布以来</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-section {
  position: relative;
  padding: 120px 0px;
}

/* ── Background glows ─────────────────────────────────── */
.stats-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.stats-glow {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(130px);
  opacity: 0.4;
}

.stats-glow--left {
  top: -120px;
  left: -120px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.22), transparent 70%);
}

.stats-glow--right {
  bottom: -120px;
  right: -120px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.16), transparent 70%);
}

.dark .stats-glow--left {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%);
}

.dark .stats-glow--right {
  background: radial-gradient(circle, rgba(168, 85, 247, 0.22), transparent 70%);
}

/* ── Container ────────────────────────────────────────── */
.stats-container {
  position: relative;
  z-index: 1;
  max-width: 1080px;
  margin: 0 auto;
}

/* ── Stats Row ────────────────────────────────────────── */
.stats-row {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 48px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0 32px;
  position: relative;
  animation: statsFadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) var(--delay) both;
}

/* 分隔线 */
.stats-item+.stats-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 12%;
  height: 76%;
  width: 1px;
  background: var(--vp-c-divider);
}

.stats-item-icon {
  font-size: 1.4rem;
  margin-bottom: 2px;
}

.stats-item-value {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark .stats-item-value {
  background: linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-item-suffix {
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-brand-2);
  -webkit-text-fill-color: var(--vp-c-brand-2);
  margin-top: -8px;
}

.stats-item-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

/* ── Download Counter ─────────────────────────────────── */
.stats-download {
  text-align: center;
  animation: statsFadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) var(--delay) both;
}

.stats-download-decor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.stats-download-arrow {
  color: var(--vp-c-brand-1);
  opacity: 0.7;
  animation: bounceDown 1.8s ease-in-out infinite;
}

.stats-download-number {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark .stats-download-number {
  background: linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-download-plus {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-brand-2);
}

.stats-download-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.stats-download-sub {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-top: 2px;
}

/* ── Animations ───────────────────────────────────────── */
@keyframes statsFadeUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceDown {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(5px);
  }
}

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 640px) {
  .stats-section {
    padding: 48px 16px;
  }

  .stats-row {
    gap: 0;
    margin-bottom: 32px;
  }

  .stats-item {
    padding: 0 16px;
    width: 50%;
    margin-bottom: 16px;
  }

  /* 只在第一项后显示分隔线（两列布局） */
  .stats-item+.stats-item::before {
    display: none;
  }

  .stats-item:nth-child(1)::after,
  .stats-item:nth-child(2)::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 12%;
    width: 76%;
    height: 1px;
    background: var(--vp-c-divider);
  }

  .stats-item:nth-child(1)::before,
  .stats-item:nth-child(2)::before {
    content: "";
    position: absolute;
    right: 0;
    top: 10%;
    height: 80%;
    width: 1px;
    background: var(--vp-c-divider);
  }

  .stats-item:nth-child(1)::before {
    display: block;
  }

  .stats-item:nth-child(2)::before {
    display: none;
  }

  .stats-item-value {
    font-size: 1.8rem;
  }

  .stats-download-number {
    font-size: 1.4rem;
  }
}
</style>
