import { defineConfig } from 'vitepress'

export default defineConfig({
  // ── 站点基础信息 ────────────────────────────────────────────
  title: '栖象工作室',
  description: 'AI 驱动的漫剧创作工具 — 从故事到分镜，从角色到视频，一站式 AI 创作工作台',
  lang: 'zh-CN',
  base: '/',

  // ── 默认外观：暗色主题 ──────────────────────────────────────
  appearance: 'dark',

  // ── 站点地图 & SEO ───────────────────────────────────────────
  sitemap: {
    hostname: 'https://www.qixiangai.chat',
  },

  // ── 自定义 head 标签 ────────────────────────────────────────
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: '栖象工作室 | AI 驱动的漫剧创作工具' }],
    ['meta', { name: 'og:description', content: '从故事到分镜，从角色到视频，一站式 AI 创作工作台' }],
    ['meta', { name: 'og:url', content: 'https://www.qixiangai.chat/' }],
    ['meta', { name: 'og:site_name', content: '栖象工作室' }],
    ['meta', { name: 'keywords', content: 'AI创作,AI漫剧,AI绘画,AI写作,AI视频,AI视频生成,AIGC,人工智能,创作工具,数字内容创作,漫画创作,漫剧制作,小说创作,视频创作,分镜生成,角色管理,栖象工作室' }],
    ['meta', { name: 'description', content: '栖象工作室 — AI 驱动的漫剧创作工具，从故事到分镜，从角色到视频，一站式 AI 创作工作台' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
  ],

  // ── Markdown 配置 ───────────────────────────────────────────
  markdown: {
    lineNumbers: true,
    container: {
      tipLabel: '💡 提示',
      warningLabel: '⚠️ 注意',
      dangerLabel: '🚨 危险',
      infoLabel: '📌 说明',
      detailsLabel: '📋 详情',
    },
  },

  // ── 主题配置 ────────────────────────────────────────────────
  themeConfig: {
    // Logo
    logo: '/logo.png',

    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      {
        text: '使用指南',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '功能总览', link: '/guide/features' },
          { text: '小说创作', link: '/guide/novel' },
          { text: '分镜生成', link: '/guide/storyboard' },
          { text: '角色与资产', link: '/guide/characters' },
          { text: '创作画布', link: '/guide/canvas' },
          { text: '3D 导演台', link: '/guide/3d-stage' },
          { text: '内置视频编辑器', link: '/guide/video-editor' },
          { text: 'Agent 助手', link: '/guide/agent' },
          { text: 'AI 模型配置', link: '/guide/ai-models' },
        ]
      },
      { text: '常见问题', link: '/guide/faq' },
      { text: '更新日志', link: '/guide/changelog' },
    ],

    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '🚀 入门',
          collapsed: false,
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '系统要求', link: '/guide/requirements' },
            { text: '功能总览', link: '/guide/features' },
          ]
        },
        {
          text: '✨ 核心功能',
          collapsed: false,
          items: [
            { text: '小说创作', link: '/guide/novel' },
            { text: '分镜生成', link: '/guide/storyboard' },
            { text: '角色与资产', link: '/guide/characters' },
            { text: '创作画布', link: '/guide/canvas' },
            { text: '3D 导演台', link: '/guide/3d-stage' },
            { text: '内置视频编辑器', link: '/guide/video-editor' },
            { text: 'Agent 助手', link: '/guide/agent' },
          ]
        },
        {
          text: '⚙️ 配置',
          collapsed: false,
          items: [
            { text: 'AI 模型配置', link: '/guide/ai-models' },
          ]
        },
        {
          text: '📖 其他',
          collapsed: false,
          items: [
            { text: '更新日志', link: '/guide/changelog' },
            { text: '常见问题', link: '/guide/faq' },
          ]
        }
      ]
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/lepen-yang/qixiangai-docs' },
    ],

    // 搜索
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '没有找到相关结果',
                resetButtonTitle: '清除搜索',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        }
      }
    },

    // 文档页右侧大纲
    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    // 上/下篇导航
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    // 页脚
    footer: {
      message: '用 AI 重新定义漫剧创作',
      copyright: `Copyright © ${new Date().getFullYear()} 栖象工作室 — 释放你的创作力`,
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: { dateStyle: 'short' },
    },

    // 返回顶部
    returnToTopLabel: '返回顶部',

    // 侧边栏菜单标签
    sidebarMenuLabel: '菜单',

    // 深色模式切换标签
    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换到深色模式',
    lightModeSwitchTitle: '切换到浅色模式',
  },
})
