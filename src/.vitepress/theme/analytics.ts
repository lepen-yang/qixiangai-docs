import posthog from 'posthog-js'

let initialized = false

/**
 * 初始化 PostHog（仅生产环境执行一次）
 */
export function initPosthog() {
  if (initialized) return
  if (!import.meta.env.PROD || import.meta.env.SSR) return

  const apiKey = import.meta.env.VITE_POSTHOG_KEY
  if (!apiKey) return

  posthog.init(apiKey)
  initialized = true
}

/**
 * 上报自定义事件（仅生产环境）
 * @param eventName 事件名称
 * @param properties 事件属性
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!initialized) return
  posthog.capture(eventName, properties)
}

/**
 * 上报页面浏览（仅生产环境）
 */
export function trackPageview() {
  if (!initialized) return
  posthog.capture('$pageview')
}
