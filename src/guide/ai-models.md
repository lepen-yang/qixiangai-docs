# AI 模型配置

栖象工作室 接入 30+ 种 AI 模型，覆盖文本、图像、视频和音频四种模态。你可以在设置中配置 API Key 和选择偏好模型。

## 概述

应用采用 Gateway + Provider 注册表架构。四种模态各有独立 Gateway（TextGateway、ImageGateway、AudioGateway、VideoGateway），每个 Gateway 下注册多个 Provider，每个 Provider 提供多个 Model。

你只需在设置中填写 Provider 的 API Key，然后为每种模态选择一个默认的 Provider + Model 即可。创作过程中可随时切换模型。

## 文本模型（LLM）

文本模型用于小说生成、分镜解析、提示词优化、Agent 对话等推理任务。

| Provider | 说明 | 鉴权方式 |
|----------|------|---------|
| Doubao（豆包） | 字节跳动大模型 | API Key |
| MiniMax | MiniMax 大模型 | API Key |
| Qwen（通义千问） | 阿里通义千问 | API Key |
| SiliconFlow | 硅基流动中转平台 | API Key |
| 147api | 第三方中转平台 | API Key |
| OpenAI | OpenAI GPT 系列 | API Key |

## 图像模型

图像模型用于角色参考图、场景参考图、分镜图片、画布图片生成等。

| Provider | 说明 | 鉴权方式 |
|----------|------|---------|
| Doubao Seedream | 字节跳动 Seedream 图像模型 | API Key |
| MiniMax | MiniMax 图像模型 | API Key |
| Wanx（通义万象） | 阿里通义万象图像 | API Key |
| Kling（可灵） | 快手可灵图像 | API Key |
| SiliconFlow | 硅基流动中转平台 | API Key |
| 147api | 第三方中转平台 | API Key |
| PPIO | PPIO 中转平台 | API Key |
| Ideogram | Ideogram 图像模型 | API Key |
| Fal | Fal 图像模型 | API Key |
| GRSai | GRSai 图像模型 | API Key |
| KIE | KIE 图像模型 | API Key |

## 视频模型

视频模型用于分镜视频片段生成、画布视频生成等。

| Provider | 说明 | 鉴权方式 |
|----------|------|---------|
| Doubao | 字节跳动视频模型 | API Key |
| MiniMax | MiniMax 视频模型 | API Key |
| Wanx（通义万象） | 阿里通义万象视频 | API Key |
| Kling（可灵） | 快手可灵视频 | API Key |
| SiliconFlow | 硅基流动中转平台 | API Key |
| 147api | 第三方中转平台 | API Key |
| Sora | OpenAI Sora | API Key |

## 音频模型

音频模型用于角色配音（TTS）和背景音乐生成。

| Provider | 说明 | 鉴权方式 |
|----------|------|---------|
| Doubao（Seed-TTS） | 字节 Seed-TTS 语音合成 | API Key |
| MiniMax | MiniMax Speech/Music | API Key |
| ElevenLabs | ElevenLabs 语音合成 | API Key |

## 配置方式

### API Key 配置

前往 **设置 → AI 模型**，在对应 Provider 的输入框中填写 API Key。保存后即可在创作流程中使用该 Provider 的模型。

一个 Provider 只需填写一次 API Key，该 Provider 下所有模型共享同一 Key。

### 模型选择

在设置页面为四种模态各选择一个默认的 Provider + Model：

- 文本（LLM）— 用于推理任务
- 图像 — 用于图片生成
- 视频 — 用于视频生成
- 音频 — 用于 TTS/音乐生成

在具体创作场景中（如分镜图片生成、Agent 对话），可临时切换到其他模型。

## 音色配置

音频模型支持多音色。在角色设置中，可为每个角色指定独立的 TTS 模型与音色 ID，实现"不同角色不同声音"的效果。

系统提供「查询音色」接口，可根据 Provider + Model 拉取可用音色列表，方便选择。

## 提示词管理

所有 AI 功能使用的系统 Prompt 均可自定义。前往 **设置 → Prompt 管理**，按分组查看：

- `project/` — 漫剧相关（分镜、资产、提示词优化、视频段落）
- `novel/` — 小说相关（设定、角色、大纲、章节、上下文）
- `agent/` — Agent 相关
- `canvas/` — 画布相关（分镜生成、灯光生成、图片工具）

每个 Prompt 显示是否已自定义（覆盖内置默认），可随时恢复内置版本。

![提示词库](https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260807123949476.png)

![设置页](https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260807130658044.png)

## 相关链接

- [功能总览](./features)
- [快速开始](./getting-started)
