# Mastra Agent 链路审查报告

基于 `/Users/lipengyang/Downloads/mastra-main/docs` 官方文档，对当前实现的全面审查。

## 1. 已确认正确的部分

### ✅ Mastra 服务配置
- `LibSQLStore` 存储配置正确
- `chatRoute()` 注册正确
- `registerApiRoute` 自定义路由正确
- CORS 配置正确

### ✅ Agent 定义
- `Agent` 类实例化正确
- `Memory` 配置正确（`lastMessages: 50`）
- `tools` 注册方式正确

### ✅ 前端 useChat 集成
- `DefaultChatTransport` 使用正确
- `prepareSendMessagesRequest` 传递 memory 参数正确
- 消息格式转换逻辑正确

---

## 2. 设计缺陷与问题

### 🔴 问题 1：model 函数返回类型错误

**现状：**
```ts
model: ({ requestContext }) => {
  return {
    id: `${providerId}/${modelId}`,
    url: getProviderBaseUrl(providerId),
    apiKey: cfg.apiKey,
  }
}
```

**问题：** Mastra 的 `model` 函数应返回 `LanguageModel` 接口（Vercel AI SDK 的 `LanguageModelV1`），而不是普通对象。`{ id, url, apiKey }` 格式仅适用于 `model` 字符串配置，不适用于函数返回。

**正确做法：** 使用 AI SDK 的 `createOpenAI` 或自定义 `LanguageModel`：
```ts
import { createOpenAI } from '@ai-sdk/openai'

model: ({ requestContext }) => {
  const providerId = requestContext.get('providerId')
  const modelId = requestContext.get('modelId')
  const cfg = SettingsStore.getProvider(providerId)
  
  return createOpenAI({
    baseURL: getProviderBaseUrl(providerId),
    apiKey: cfg.apiKey,
  })(modelId)
}
```

---

### 🔴 问题 2：历史消息加载机制缺失

**现状：** `useChat()` 的 `initialMessages` 为空数组，切换会话时不会加载历史消息。

**问题：** 官方文档明确指出：
> "When you use memory with a client application, send only the new message from the client instead of the full conversation history."

但 `useChat()` 需要初始消息来渲染历史。当前实现切换会话后消息列表为空。

**正确做法：** 切换会话时，先通过 API 获取历史消息，转换为 UIMessage 格式后传入 `initialMessages`：
```ts
// 切换会话时
const historyResp = await fetch(`${MASTRA_API}/sessions/${sessionId}/messages`)
const history = await historyResp.json()
const uiMessages = convertToUIMessages(history.data)
// 使用新的 useChat instance 或 reset messages
```

---

### 🔴 问题 3：session title 自动生成未启用

**现状：** 会话标题使用客户端生成的"新对话 xxx"，Mastra 不会自动生成。

**正确做法：** 启用 `generateTitle`：
```ts
memory: new Memory({
  options: {
    lastMessages: 50,
    generateTitle: true,  // 自动生成标题
  },
}),
```

---

### 🟡 问题 4：requestContext 中 memory 参数传递方式

**现状：** 通过 `prepareSendMessagesRequest` 的 `body.memory` 传递。

**问题：** `chatRoute()` 需要正确解析 `body.memory` 并传递给 `agent.stream()`。需要确认 `chatRoute()` 是否自动处理 `memory` 字段。

**验证：** 根据官方示例，`prepareSendMessagesRequest` 的 `body` 会传递给 agent 执行，`memory` 字段应被正确处理。但需要实际测试确认。

---

### 🟡 问题 5：缺少错误处理和重试机制

**现状：** 如果 Mastra 服务未启动或崩溃，前端没有任何提示。

**正确做法：**
```ts
// useMastraChat 中
const { error, status } = useChat({ transport })

useEffect(() => {
  if (error) {
    // 检查是否是连接错误
    if (error.message?.includes('fetch')) {
      toast.error('无法连接到 AI 服务，请稍后重试')
    }
  }
}, [error])
```

---

### 🟡 问题 6：缺少 AbortController 与 Mastra 的集成

**现状：** `useChat()` 的 `stop()` 会中止前端请求，但 Mastra 端的 `agent.stream()` 可能仍在执行。

**说明：** 根据官方文档，`chatRoute()` 会转发 `AbortSignal` 给 `agent.stream()`，所以理论上应该能正确中止。但需要验证。

---

## 3. 缺失的功能

### ❌ 缺失 1：工具集不完整

**现状：** 只有 `generateImage` 一个工具。

**原系统工具：**
- `generateImage` — 图片生成 ✅ 已迁移
- `generateVideo` — 视频生成 ❌ 缺失
- `generateAudio` — 音频生成 ❌ 缺失
- `webSearch` — 联网搜索 ❌ 缺失
- `novelTools` — 小说 CRUD（13 个）❌ 缺失
- `projectTools` — 漫剧 CRUD（15 个）❌ 缺失
- `episodeTools` — 剧集 CRUD（17 个）❌ 缺失

**建议：** 优先迁移高频使用的工具（webSearch、novelTools），其余按需添加。

---

### ❌ 缺失 2：Observational Memory（长期记忆）

**现状：** 仅使用基础的 message history。

**建议：** 对于创作类应用，Observational Memory 很有价值：
```ts
memory: new Memory({
  options: {
    lastMessages: 50,
    generateTitle: true,
    observationalMemory: true,  // 启用长期记忆
  },
}),
```

---

### ❌ 缺失 3：系统 Prompt 动态注入

**现状：** `instructions` 是静态字符串。

**原系统：** 支持 `systemContext` 动态注入（如小说背景、角色设定）。

**建议：** 使用 `instructions` 函数：
```ts
instructions: async ({ requestContext }) => {
  const systemContext = requestContext.get('systemContext') || ''
  return `${basePrompt}\n\n${systemContext}`
}
```

---

### ❌ 缺失 4：会话持久化（删除/重命名）

**现状：** 删除/重命名仅在前端生效，Mastra Memory 中的数据不变。

**建议：** 添加 API route 支持删除 thread：
```ts
registerApiRoute('/sessions/:threadId', {
  method: 'DELETE',
  handler: async (c) => {
    const threadId = c.req.param('threadId')
    const memory = mastra.getMemory()
    await memory.deleteThread(threadId)
    return c.json({ success: true })
  },
})
```

---

### ❌ 缺失 5：媒体输入（图片/视频/音频）

**现状：** `useChat()` 只发送文本，不支持媒体附件。

**原系统：** 支持 `mediaRefs`（参考图、视频、音频）。

**建议：** 使用 AI SDK 的 `FilePart` 和 `ImagePart`：
```ts
sendMessage({
  text: prompt,
  parts: [
    { type: 'image', image: imageUrl },
  ]
})
```

---

## 4. 架构建议

### 建议 1：添加健康检查端点

```ts
registerApiRoute('/health', {
  method: 'GET',
  handler: async (c) => {
    return c.json({ status: 'ok', timestamp: Date.now() })
  },
})
```

### 建议 2：添加请求日志中间件

```ts
server: {
  middleware: [
    async (c, next) => {
      const start = Date.now()
      await next()
      console.log(`[Mastra] ${c.req.method} ${c.req.url} - ${Date.now() - start}ms`)
    },
  ],
}
```

### 建议 3：使用 Mastra 的 `maxSteps` 限制

```ts
// chatRoute 的 defaultOptions
chatRoute({
  path: '/chat/:agentId',
  defaultOptions: {
    maxSteps: 10,  // 限制工具调用轮数
  },
})
```

---

## 5. 优先级排序

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | model 函数返回类型错误 | Agent 无法正确调用 LLM |
| P0 | 历史消息加载机制缺失 | 切换会话后无历史 |
| P1 | session title 自动生成 | 用户体验 |
| P1 | 错误处理和重试 | 服务不可用时无提示 |
| P2 | 工具集不完整 | 功能受限 |
| P2 | 系统 Prompt 动态注入 | 创作场景受限 |
| P3 | 媒体输入支持 | 图生图场景 |
| P3 | Observational Memory | 长期记忆 |
| P3 | 会话删除/重命名持久化 | 数据一致性 |
