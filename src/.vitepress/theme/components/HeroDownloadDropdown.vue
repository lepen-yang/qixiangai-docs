<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import VPButton from 'vitepress/dist/client/theme-default/components/VPButton.vue'
import { trackEvent } from '../analytics'
import releaseData from '../release-data.json'

const RELEASE_BASE = 'https://app.qixiangai.chat/releases/qixiang-studio'

interface DownloadItem {
  label: string
  file: string
  available: boolean
}

interface Platform {
  name: string
  version: string
  icon: string
  items: DownloadItem[]
}

const platformIcons: Record<string, string> = {
  macOS: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.21-1.98 1.08-3.11-1.05.05-2.31.72-3.06 1.64-.68.84-1.26 1.99-1.1 3.1 1.17.09 2.37-.74 3.08-1.63z"/></svg>',
  Windows: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>',
}

const platforms = ref<Platform[]>(
  releaseData.platforms.map((p: any) => ({
    name: p.name,
    version: p.version || '',
    icon: platformIcons[p.name] || '',
    items: p.items.map((it: any) => ({
      label: it.label,
      file: it.file,
      available: it.available,
    })),
  }))
)

const open = ref(false)
const menuPosition = ref({ top: '0px', left: '0px' })
const triggerRef = ref<HTMLElement | null>(null)

function trackDownloadClick(platform: Platform, label: string, file: string) {
  trackEvent('download_click', {
    platform: platform.name,
    version: platform.version,
    label,
    file,
  })
}

function onMainDownloadClick() {
  open.value = !open.value
  trackEvent('download_button_click', {
    action: open.value ? 'open' : 'close',
  })
}

function onDownloadLinkClick(platform: Platform, item: DownloadItem) {
  if (!item.available) return
  open.value = false
  trackDownloadClick(platform, item.label, item.file)
}

function updateMenuPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  menuPosition.value = {
    top: `${rect.bottom + 20}px`,
    left: `${rect.left}px`,
  }
}

watch(open, async (val) => {
  if (val) {
    await nextTick()
    updateMenuPosition()
  }
})

function onResize() {
  if (open.value) updateMenuPosition()
}

function onClickOutside(e: MouseEvent) {
  if (triggerRef.value && !triggerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener("scroll", onResize)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener("scroll", onResize)
  window.removeEventListener('resize', onResize)

})

function detectPlatform(): string {
  if (import.meta.env.SSR) return ''
  const ua = navigator.userAgent
  if (/Mac|iPod|iPhone|iPad/.test(ua)) return 'macOS'
  if (/Win/.test(ua)) return 'Windows'
  return ''
}

const currentPlatform = detectPlatform()

const displayVersion = computed(() => {
  if (currentPlatform) {
    const match = platforms.value.find((p) => p.name === currentPlatform)
    if (match?.version) return match.version
  }
  const fallback = platforms.value.find((p) => p.version)
  return fallback?.version || ''
})

const buttonText = computed(() => {
  return displayVersion.value ? `立即下载 v${displayVersion.value}` : '立即下载'
})
</script>

<template>
  <div class="hero-download-actions">


    <div class="action" ref="triggerRef" @click="onMainDownloadClick" aria-haspopup="true" :aria-expanded="open">
      <VPButton tag='button' theme="brand" size="medium" :text="buttonText" />
    </div>

    <div class="action">
      <VPButton tag="a" theme="alt" size="medium" text="快速开始" href="/guide/getting-started" />
    </div>


    <div v-if="open" class="hero-download-menu hero-download-menu--open"
      :style="{ top: menuPosition.top, left: menuPosition.left }">
      <div class="hero-download-menu-inner">
        <div v-for="platform in platforms" :key="platform.name" class="hero-download-platform">
          <div class="hero-download-platform-header">
            <span class="hero-download-platform-icon" v-html="platform.icon"></span>
            <span class="hero-download-platform-name">{{ platform.name }}</span>
          </div>
          <div class="hero-download-platform-links">
            <a v-for="item in platform.items" :key="item.file"
              :href="item.available ? `${RELEASE_BASE}/${item.file}` : undefined" class="hero-download-link"
              :class="{ 'hero-download-link--disabled': !item.available }" target="_blank" rel="noopener"
              @click="item.available ? onDownloadLinkClick(platform, item) : undefined">
              <span>{{ item.label }}</span>
              <svg v-if="item.available" class="hero-download-link-icon" width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" />
              </svg>
              <span v-else class="hero-download-link-soon">即将推出</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-download-actions {
  display: flex;
  flex-wrap: wrap;
  padding-top: 24px;
  justify-content: center;
}

@media (min-width: 960px) {
  .hero-download-actions {
    justify-content: flex-start;
  }
}

@media (min-width: 640px) {
  .hero-download-actions {
    padding-top: 32px;
  }
}

.hero-download-actions .action {
  flex-shrink: 0;
  padding: 6px;
}

.hero-download-actions .action .brand {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 28px;
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.hero-download-actions .action .brand:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.dark .hero-download-actions .action .brand {
  box-shadow: 0 4px 14px rgba(129, 140, 248, 0.25);
}

.hero-download-actions .action .alt {
  border: 1px solid var(--vp-c-border);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--vp-c-text-1);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 28px;
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-download-actions .action .alt:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: var(--vp-shadow-glow);
}



.hero-download-menu {
  position: fixed;
  z-index: 999999;
  pointer-events: auto;
}


.hero-download-menu-inner {
  background: var(--vp-c-bg-elv, #fff);
  border: 1px solid var(--vp-c-border, #e2e2e3);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  padding: 12px;
  min-width: 280px;
  overflow: hidden;
}

.dark .hero-download-menu-inner {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
  border-color: var(--vp-c-border, #2e2e32);
}

.hero-download-platform+.hero-download-platform {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--vp-c-border, #e2e2e3);
}

.hero-download-platform-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 8px;
}

.hero-download-platform-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2, #3c3c43);
  opacity: 0.7;
}

.hero-download-platform-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.hero-download-platform-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2, #3c3c43);
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.hero-download-platform-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-download-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-1, #1a1a1a);
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.hero-download-link:hover {
  background: var(--vp-c-bg-soft, #f6f6f7);
  border-color: var(--vp-c-brand-soft, #e0e7ff);
  color: var(--vp-c-brand-1, #4f46e5);
}

.hero-download-link-icon {
  opacity: 0.5;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
  margin-left: 8px;
}

.hero-download-link:hover .hero-download-link-icon {
  opacity: 1;
}

.hero-download-link--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
  color: var(--vp-c-text-3, #6b6b6b);
}

.hero-download-link-soon {
  font-size: 0.72rem;
  opacity: 0.5;
  font-weight: 500;
  flex-shrink: 0;
}
</style>
