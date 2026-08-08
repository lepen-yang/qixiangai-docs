<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface ShowcaseItem {
  title: string
  subtitle: string
  description: string
  image: string
  link: string
  tag: string
}

const showcases: ShowcaseItem[] = [
  {
    title: '小说创作引擎',
    subtitle: '从灵感落笔到长篇成文',
    description: 'AI 一键生成世界观、角色设定与故事大纲，五大上下文系统确保长篇叙事的前后一致性。支持逐章撰写、自动记忆压缩与角色状态追踪。',
    image: 'https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260807123148463.png',
    link: '/guide/novel',
    tag: 'AI 写作',
  },
  {
    title: '分镜自动生成',
    subtitle: '剧本到画面，一键解析',
    description: '输入剧本，AI 自动解析为结构化分镜脚本。每镜包含景别、构图、情绪、图像提示词与视觉描述，支持批量生图与配音。',
    image: 'https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260807130725331.png',
    link: '/guide/storyboard',
    tag: 'AI 分镜',
  },
  {
    title: '资产统一管理',
    subtitle: '角色、场景、道具一站式管理',
    description: '为每个角色、场景、道具生成 AI 参考图与提示词，支持从小说自动导入，跨项目复用。资产地图直观追踪每个资产的使用场景。',
    image: 'https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260807122739195.png',
    link: '/guide/characters',
    tag: '资产管理',
  },
  {
    title: '节点式创作画布',
    subtitle: '24 种节点，自由串联创作流',
    description: '图片生成、视频编辑、文本推理、3D 导演台等节点通过连线传递数据，构建从资产到成片的完整流水线。内置 AI 分镜序列、智能扩图、局部重绘等工具。',
    image: 'https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260807123713607.png',
    link: '/guide/canvas',
    tag: '可视化工作流',
  },
  {
    title: '3D 导演台',
    subtitle: '在三维空间中执导每一帧',
    description: '基于 Three.js 的场景编辑器，摆放角色模型与道具，AI 自动生成灯光配置，一键截取镜头画面作为分镜参考图。支持轨道相机、WASD 漫游与镜头画廊。',
    image: 'https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260807123836407.png',
    link: '/guide/3d-stage',
    tag: '3D 场景',
  },
  {
    title: '内置视频编辑器',
    subtitle: '从剪辑到成片，无需离开应用',
    description: '集成 OpenCut 视频编辑器，支持时间线多轨道编辑、WebGL 实时渲染、特效、蒙版、字幕与语音转文字。支持 H.264 / WebM / GIF / PNG 序列导出。',
    image: 'https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260808231136361.png',
    link: '/guide/video-editor',
    tag: '视频剪辑',
  },
]

const sectionRef = ref<HTMLElement | null>(null)
const visibleItems = ref<boolean[]>(new Array(showcases.length).fill(false))

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Number((entry.target as HTMLElement).dataset.index)
          if (!visibleItems.value[idx]) {
            visibleItems.value[idx] = true
          }
        }
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  )

  const items = sectionRef.value?.querySelectorAll('.showcase-row')
  items?.forEach((item) => observer?.observe(item))
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <section ref="sectionRef" class="showcase-section">
    <div class="showcase-container">
      <!-- 区域标题 -->
      <div class="showcase-header">
        <span class="showcase-header-tag">功能展示</span>
        <h2 class="showcase-header-title">一站式 AI 创作工作台</h2>
        <p class="showcase-header-desc">
          从故事构思到最终成片，每一个创作环节都有 AI 的深度参与
        </p>
      </div>

      <!-- 交错布局展示 -->
      <div class="showcase-rows">
        <div v-for="(item, index) in showcases" :key="item.title" :data-index="index" class="showcase-row" :class="{
          'showcase-row--reverse': index % 2 === 1,
          'showcase-row--visible': visibleItems[index],
        }">
          <!-- 文字内容 -->
          <div class="showcase-content">
            <span class="showcase-tag">{{ item.tag }}</span>
            <h3 class="showcase-title">{{ item.title }}</h3>
            <p class="showcase-subtitle">{{ item.subtitle }}</p>
            <p class="showcase-desc">{{ item.description }}</p>
            <a :href="item.link" class="showcase-link">
              了解更多
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>

          <!-- 图片 -->
          <div class="showcase-image-wrap">
            <div class="showcase-image-inner">
              <img :src="item.image" :alt="item.title" loading="lazy" />
              <div class="showcase-image-glow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.showcase-section {
  position: relative;
  padding-top: 96px;
}

.showcase-container {
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ── Header ─────────────────────────── */
.showcase-header {
  text-align: center;
  margin-bottom: 80px;
}

.showcase-header-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 6px 14px;
  border-radius: 100px;
  margin-bottom: 20px;
}

.showcase-header-title {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--vp-c-text-1);
  margin: 0 0 16px;
}

.showcase-header-desc {
  font-size: 1.05rem;
  color: var(--vp-c-text-2);
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ── Row ────────────────────────────── */
.showcase-rows {
  display: flex;
  flex-direction: column;
  gap: 96px;
}

.showcase-row {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 64px;
  align-items: center;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.showcase-row--reverse {
  grid-template-columns: 1.15fr 1fr;
  direction: rtl;
}

.showcase-row--reverse .showcase-content {
  direction: ltr;
}

.showcase-row--reverse .showcase-image-wrap {
  direction: ltr;
}

.showcase-row--visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Content ────────────────────────── */
.showcase-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.showcase-tag {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  margin-bottom: 14px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-brand-soft);
  border-radius: 6px;
  background: var(--vp-c-brand-soft);
}

.showcase-title {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
}

.showcase-subtitle {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin: 0 0 16px;
  line-height: 1.5;
}

.showcase-desc {
  font-size: 0.92rem;
  line-height: 1.8;
  color: var(--vp-c-text-3);
  margin: 0 0 24px;
  max-width: 440px;
}

.showcase-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: gap 0.25s ease;
}

.showcase-link:hover {
  gap: 12px;
}

.showcase-link svg {
  transition: transform 0.25s ease;
}

.showcase-link:hover svg {
  transform: translateX(3px);
}

/* ── Image ──────────────────────────── */
.showcase-image-wrap {
  position: relative;
}

.showcase-image-inner {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.5s ease;
}

.showcase-row--visible .showcase-image-inner {
  transform: translateY(0) scale(1);
}

.showcase-image-inner:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--vp-shadow-3), 0 24px 48px rgba(99, 102, 241, 0.1);
}

.dark .showcase-image-inner:hover {
  box-shadow: var(--vp-shadow-3), 0 24px 48px rgba(129, 140, 248, 0.12);
}

.showcase-image-inner img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.showcase-image-inner:hover img {
  transform: scale(1.03);
}

.showcase-image-glow {
  position: absolute;
  inset: -20px;
  z-index: -1;
  border-radius: 24px;
  background: radial-gradient(ellipse 60% 50% at 50% 50%,
      rgba(99, 102, 241, 0.08),
      transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.showcase-image-inner:hover .showcase-image-glow {
  opacity: 1;
}

.dark .showcase-image-glow {
  background: radial-gradient(ellipse 60% 50% at 50% 50%,
      rgba(129, 140, 248, 0.1),
      transparent 70%);
}

/* ── Decorative background glow ─────── */
.showcase-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 400px;
  background: radial-gradient(ellipse 50% 50% at 50% 0%,
      rgba(99, 102, 241, 0.06),
      transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.dark .showcase-section::before {
  background: radial-gradient(ellipse 50% 50% at 50% 0%,
      rgba(129, 140, 248, 0.08),
      transparent 70%);
}

/* ── Responsive ─────────────────────── */
@media (max-width: 960px) {
  .showcase-section {
    padding-top: 64px;
  }

  .showcase-header {
    margin-bottom: 56px;
  }

  .showcase-header-title {
    font-size: 1.9rem;
  }

  .showcase-rows {
    gap: 56px;
  }

  .showcase-row,
  .showcase-row--reverse {
    grid-template-columns: 1fr;
    gap: 32px;
    direction: ltr;
  }

  .showcase-row--reverse .showcase-content {
    direction: ltr;
  }

  .showcase-row--reverse .showcase-image-wrap {
    direction: ltr;
  }

  .showcase-content {
    order: 2;
  }

  .showcase-image-wrap {
    order: 1;
  }

  .showcase-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .showcase-header-title {
    font-size: 1.6rem;
  }

  .showcase-header-desc {
    font-size: 0.95rem;
  }

  .showcase-rows {
    gap: 48px;
  }

  .showcase-title {
    font-size: 1.3rem;
  }

  .showcase-subtitle {
    font-size: 1rem;
  }

  .showcase-desc {
    font-size: 0.88rem;
  }
}
</style>
