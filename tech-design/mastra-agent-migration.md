# Mastra Agent 接入技术方案（v2）

## 1. 目标

将 StudioAgentPage 的对话功能从自研 agent 执行器迁移到 [Mastra](https://mastra.ai)，利用其内置的 agent 循环、memory 持久化、流式输出能力，同时**去掉 IPC 层**，前端直接 HTTP 调用 Mastra 服务。

## 2. 架构对比

### 2.1 当前架构（IPC 模式）

```
Renderer (React)
  ↕ window.agent.chat() [IPC bridge]
Preload (contextBridge)
  ↕ IPC channel 'agent:chat'
Main Process
  ↕
chat.service.ts (会话管理 + 消息持久化 + 流式转发)
  ↕
executor.ts (手写多轮 tool-calling 循环)
  ↕
TextGateway → Provider Registry → LLM API
```

### 2.2 目标架构（HTTP 直连，官方推荐）

```
Renderer (React) ─── useChat() ─── fetch ───► Mastra Server (port 4111)
                                        │
                                        ├── chatRoute('/chat/:agentId')
                                        ├── Agent (内置 agentic loop)
                                        ├── Memory (LibSQL 持久化)
                                        ├── Custom Model Resolver → 现有 Provider Registry
                                        └── Tools (createTool 定义)

Main Process ─── 仅负责启动 Mastra 子进程
```

**核心变化：**
- 去掉 `preload/bridges/agent.ts`、`ipc/agent/index.ts`、`stream-ipc` 等 IPC 层
- 去掉 `executor.ts` 手写循环（~330 行）
- 去掉 `chat.service.ts` 手写 DB 持久化
- 前端使用标准 `useChat()` hook，流式/工具调用/状态/abort 全部内置
- 多 Provider 通过 Mastra 的 `model` 函数 + `requestContext` 路由到现有 Provider Registry

## 3. Mastra 核心概念（基于官方文档）

### 3.1 Agent

```ts
import { Agent } from '@mastra/core/agent'

const studioAgent = new Agent({
  id: 'studio-agent',
  name: 'Studio Agent',
  instructions: '...',         // system prompt
  model: resolverFunction,      // 动态模型路由（见 §5.1）
  tools: { ... },
  memory: new Memory({ ... }),
})
```

### 3.2 chatRoute + useChat（前端直连）

**后端：**
```ts
import { chatRoute } from '@mastra/ai-sdk'

export const mastra = new Mastra({
  agents: { studioAgent },
  server: {
    cors: { origin: '*', allowMethods: ['*'], allowHeaders: ['*'] },
    apiRoutes: [chatRoute({ path: '/chat/:agentId' })],
  },
})
```

**前端：**
```ts
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

const { messages, sendMessage, stop } = useChat({
  transport: new DefaultChatTransport({
    api: 'http://localhost:4111/chat/studio-agent',
    prepareSendMessagesRequest: ({ messages }) => ({
      body: {
        messages: [messages[messages.length - 1]],  // 只发新消息
        memory: { thread: sessionId, resource: 'user' },
        providerId: activeLlm.providerId,             // 自定义参数
        modelId: activeLlm.modelId,
      },
    }),
  }),
})
```

### 3.3 Memory（服务端持久化）

```ts
import { Memory } from '@mastra/memory'
import { LibSQLStore } from '@mastra/libsql'

const memory = new Memory({
  storage: new LibSQLStore({ url: 'file:./mastra.db' }),
  options: { lastMessages: 50 },
})
```

- `resourceId`：用户/实体标识（如 `'user'`）
- `threadId`：会话标识（对应 sessionId）
- 自动存储：user/assistant messages + tool calls/results
- 前端只发新消息，历史由服务端加载（避免 timestamp 冲突）

### 3.4 Tools

```ts
import { createTool } from '@mastra/core/tools'

createTool({
  id: 'generateImage',
  description: '...',
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({ path: z.string() }),
  execute: async ({ prompt }, { abortSignal, writer }) => {
    // 工具逻辑
  },
})
```

### 3.5 Model Router（多 Provider 支持）

Mastra 的 `model` 字段支持：
- 字符串：`'openai/gpt-4'`
- 配置对象：`{ id, url, apiKey, headers }`
- AI SDK provider：`groq('gemma2-9b-it')`
- **函数**（动态路由）：`({ requestContext }) => LanguageModelV3 | string`

**169+ providers / 5466+ models 已内置**，同时支持自定义。

## 4. 核心设计

### 4.1 多 Provider 适配 — 直接配置，无需适配层

**关键发现：** Mastra 原生支持大部分现有 Provider，通过 `{ id, url, apiKey }` 配置即可对接任意 OpenAI 兼容 API，**不需要** LanguageModelV3 适配层。

**Mastra 已内置的 Provider：**

| Provider | Mastra ID | 内置模型数 | 说明 |
|----------|-----------|----------|------|
| OpenAI | `openai/*` | 47 | 原生支持 |
| Qwen（通义千问） | `alibaba/*` | 54 | 使用 DASHSCOPE_API_KEY |
| MiniMax | `minimax/*` | 7 | 使用 MINIMAX_API_KEY |
| SiliconFlow | `siliconflow/*` | 49 | 使用 SILICONFLOW_API_KEY |
| Moark（火山引擎） | `moark/*` | 2 | 使用 MOARK_API_KEY |

**方案：`model` 函数 + `requestContext` 动态路由**

```ts
// src/main/mastra/agents/studio-agent.ts
export const studioAgent = new Agent({
  id: 'studio-agent',
  name: 'Studio Agent',
  instructions: SYSTEM_PROMPTS.studio,
  model: ({ requestContext }) => {
    const providerId = requestContext.get('providerId')
    const modelId = requestContext.get('modelId')
    // 从 settingsStore 读取 baseURL + apiKey（已在用户设置中配置）
    const cfg = SettingsStore.getProvider(providerId)
    return {
      id: `${providerId}/${modelId}`,
      url: getProviderBaseUrl(providerId),
      apiKey: cfg.apiKey,
    }
  },
  tools: mastraTools,
  memory: agentMemory,
})
```

**Provider baseURL 映射：**

```ts
function getProviderBaseUrl(providerId: string): string {
  const map: Record<string, string> = {
    doubao: 'https://ark.cn-beijing.volces.com/api/v3',
    minimax: 'https://api.minimaxi.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    siliconflow: 'https://api.siliconflow.cn/v1',
    openai: 'https://api.openai.com/v1',
    '147api': 'https://api.147api.com/v1',
  }
  return map[providerId]
}
```

**优势：**
- 完全复用现有 `settingsStore` 的 apiKey 配置
- 不需要维护额外的 Provider 凭证
- 用户切换 Provider 时 Mastra 自动使用对应的 baseURL + apiKey
- **去掉了 LanguageModelV3 适配层、TextGateway、executor.ts 等中间层**

**Doubao 特殊处理：** Doubao 使用 Responses API（`/v1/responses`），Mastra 内置走 `/v1/chat/completions`。需确认：
- 方案 A：改用 Doubao 的 Chat Completions 兼容模式（如果支持）
- 方案 B：对 Doubao 保留现有 TextGateway 调用，通过 AI SDK provider 实例注入

### 4.2 自定义 API Route（传递 provider/model 参数）

前端通过 `prepareSendMessagesRequest` 传入 `providerId`/`modelId`，后端通过 middleware 写入 `requestContext`：

```ts
// src/main/mastra/index.ts
export const mastra = new Mastra({
  server: {
    middleware: [
      async (c, next) => {
        if (c.req.method === 'POST') {
          const body = await c.req.raw.clone().json()
          const rc = c.get('requestContext')
          rc.set('providerId', body?.providerId)
          rc.set('modelId', body?.modelId)
        }
        await next()
      },
    ],
    apiRoutes: [chatRoute({ path: '/chat/:agentId' })],
  },
})
```

### 4.3 Mastra 进程管理

**开发环境**：`npx mastra dev`（独立终端，热重载）

**生产环境**：Electron 主进程 fork 子进程：

```ts
// src/main/process/mastra-server.ts
import { utilityProcess } from 'electron'

export function startMastraServer() {
  const proc = utilityProcess.fork(path.join(__dirname, 'mastra-entry.mjs'))
  return proc
}
```

### 4.4 CSP 配置

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; connect-src http://localhost:4111; ..." />
```

### 4.5 前端迁移（方案 A：AI SDK UI）

**选用 AI SDK UI（`@ai-sdk/react` + `ai`）**，保留现有 ChatBubble 组件，仅替换数据层。

| 现有 | 迁移后 |
|------|--------|
| `window.agent.chat(req, callbacks)` | `useChat()` + `sendMessage()` |
| `onToken` 回调 | `message.parts` 中 `type === 'text'` |
| `onToolCall` / `onToolResult` | `message.parts` 中 `type === 'tool-xxx'` |
| `onStatus` | `useChat()` 的 `status` |
| `window.agent.abortChat(requestId)` | `useChat()` 的 `stop()` |
| `buildHistoryFromDb()` | Mastra Memory 自动加载（`toAISdkV5Messages()` 转换初始消息） |
| `AgentRepository` CRUD | Mastra Memory API |

**前端数据流：**
```
useChat() → DefaultChatTransport → fetch('http://localhost:4111/chat/studio-agent')
                ↓
           message.parts = [
             { type: 'text', token: '...' },
             { type: 'tool-generateImage', state: 'output-available', output: {...} },
             ...
           ]
                ↓
           转换为现有 ChatMessage[] 格式 → ChatBubble 组件渲染
```

### 4.6 会话列表

Mastra Memory 提供 API 查询 threads：
```ts
const memory = agent.memory
const threads = await memory.query({ resource: 'user' })
// 返回 thread metadata（id, title, createdAt 等）
```

前端 sessions 列表从 Mastra API 获取，不再依赖 `agent_sessions` 表。

## 5. 实施计划

### Phase 1: Mastra 服务搭建

1. **安装依赖**
   ```bash
   npm install @mastra/core @mastra/memory @mastra/libsql @mastra/ai-sdk
   npm install @ai-sdk/react ai  # 前端
   ```

2. **创建 Mastra 项目结构**
   ```
   src/main/mastra/
   ├── index.ts              # Mastra 实例 + chatRoute + middleware
   ├── entry.ts              # 子进程入口
   ├── agents/
   │   └── studio-agent.ts   # Agent 定义
   ├── tools/
   │   ├── index.ts          # 工具集导出
   │   ├── media-tools.ts    # 图像/视频/音频生成
   │   ├── studio-tools.ts   # 小说/项目/剧集 CRUD
   │   └── web-search.ts     # 联网搜索
   ```

3. **配置 model 动态路由**
   - `model` 函数从 `requestContext` 读取 providerId/modelId
   - `getProviderBaseUrl()` 映射 baseURL
   - 复用 `settingsStore` apiKey

4. **工具集迁移**
   - LangChain `DynamicStructuredTool` → Mastra `createTool()`

### Phase 2: 前端迁移

5. **CSP 配置**（`index.html`）
6. **替换 `agentChatStore.handleSend()`**
   - `window.agent.chat()` → `useChat()` + `sendMessage()`
   - 流式事件从 `message.parts` 提取
7. **会话列表**
   - 从 Mastra Memory API 获取 threads
   - 不再依赖 `AgentRepository.listSessions()`

### Phase 3: 验证与清理

8. **功能验证**
9. **清理旧代码**

## 6. 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| Doubao Responses API 不兼容 | Doubao 无法直接用 Mastra 内置客户端 | 测试 Chat Completions 兼容模式，或保留 Doubao 特殊处理 |
| Mastra Memory 与现有数据不兼容 | 历史对话丢失 | 初期并行运行 |
| 媒体输入（图片/视频） | Mastra 默认不支持多模态 | 通过 `providerOptions` 或自定义 part 处理 |
| 子进程管理 | Mastra 崩溃 | 自动重启 + 健康检查 |
| Mastra 版本稳定性 | API 变动 | 锁定版本 |

## 7. 核心优势

1. **去 IPC**：移除 preload bridges + ipc handlers + stream-ipc
2. **标准化**：`useChat()` + AI SDK，生态兼容
3. **省心**：agent 循环 + memory + 流式全部内置
4. **可扩展**：MCP、observability、evaluation 按需接入
5. **代码精简**：
   - 移除 executor.ts（~330 行手写循环）
   - 移除 chat.service.ts 大部分逻辑
   - 移除 preload/bridges/agent.ts
   - 移除 ipc/agent/index.ts
   - 移除 TextGateway / Provider Registry（文本生成部分）
   - 移除 LanguageModelV3 适配层（不需要了）
   - 移除 ipc/agent/index.ts
   - 移除 agent_sessions / agent_messages 表（可选）

## 8. 文件变更清单

### 新增文件
- `src/main/mastra/index.ts` — Mastra 实例 + chatRoute + middleware
- `src/main/mastra/entry.ts` — 子进程入口
- `src/main/mastra/agents/studio-agent.ts` — Agent 定义（含 model 动态路由）
- `src/main/mastra/tools/index.ts` — 工具集导出
- `src/main/mastra/tools/media-tools.ts` — 媒体生成工具
- `src/main/mastra/tools/studio-tools.ts` — Studio CRUD 工具
- `src/main/mastra/tools/web-search.ts` — 联网搜索工具
- `src/main/process/mastra-server.ts` — 子进程管理
- `src/renderer/src/lib/mastra-chat.ts` — useChat 配置 + transport

### 修改文件
- `src/renderer/index.html` — CSP 添加 `connect-src http://localhost:4111`
- `src/renderer/src/stores/agentChatStore.ts` — 改用 useChat()
- `src/main/index.ts` — 启动 Mastra 子进程

### 可移除文件（Phase 3）
- `src/main/services/agent/executor.ts`
- `src/main/services/agent/chat.service.ts`
- `src/main/services/agent/tools/`
- `src/main/ipc/agent/index.ts`
- `src/preload/bridges/agent.ts`
- `src/main/repositories/agent/`
