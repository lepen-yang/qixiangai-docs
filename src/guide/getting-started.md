# 快速开始

## 下载与安装

栖象工作室 支持 macOS、Windows 和 Linux 三大平台。前往[首页下载区](/)选择对应版本。

### macOS

1. 下载 `qixiang-studio-x.x.x-arm64.dmg`（Apple Silicon）或 `.zip` 文件。
2. 双击 dmg 文件，将 `qixiang-studio.app` 拖入 `/Applications` 文件夹。
3. 首次启动时，macOS 可能提示"无法验证开发者"。前往 **系统设置 → 隐私与安全性**，点击「仍要打开」即可。

::: tip 🍎 芯片判断
点击屏幕左上角  → 「关于本机」，若芯片栏显示"Apple"开头（如 Apple M1、M2、M3），请下载 Apple Silicon 版本；若显示"Intel"，请下载 Intel 版本。
:::

### Windows

1. 下载 `qixiang-studio-x.x.x-setup.exe` 安装包。
2. 双击安装包，选择安装路径，按向导完成安装。
3. 安装完成后，桌面会出现快捷方式，双击启动。

::: warning 🛡️ 安全提示
安装包未经 EV 代码签名，部分安全软件会误报。可临时关闭实时防护完成安装，安装后重新开启。
:::

### Linux

1. 下载 `qixiang-studio-x.x.x.AppImage`（推荐）或 `.deb` 文件。
2. AppImage 方式：赋予执行权限后直接运行：`chmod +x qixiang-studio-*.AppImage && ./qixiang-studio-*.AppImage`
3. deb 方式：`sudo dpkg -i qixiang-studio-*.deb`

## 首次启动

启动后进入项目管理页面，你可以：

![漫剧项目列表](https://liangx-gallery.oss-cn-beijing.aliyuncs.com/20260807123026352.png)

**新建漫剧项目** — 创建一个漫剧项目，设定类型与风格，开始从剧本到视频的创作流程。

**新建小说** — 创建一个小说项目，AI 辅助生成设定、角色、大纲与正文，完成后导入为漫剧。

**打开创作画布** — 进入节点式画布，自由组合图片生成、视频生成、文本推理等节点。

**使用 Agent 助手** — 通过自然语言对话，让 AI 帮你完成创作任务。

## 配置 AI 模型

栖象工作室 的 AI 功能需要配置模型 Provider。前往 **设置 → AI 模型**，填写至少一个 Provider 的 API Key。

详细配置方式请参考 [AI 模型配置](./ai-models)。

::: tip 💡 快速开始
最低配置只需一个文本模型（LLM）和一个图像模型即可开始使用。视频和音频模型可在需要时再配置。
:::

## 自动更新

栖象工作室 内置自动更新功能。当有新版本发布时，应用右下角会弹出更新提示，点击「立即更新」即可一键升级。

你也可以在 **设置 → 关于与更新** 中手动检查更新。更新包在后台下载完成后，下次启动应用时会自动应用。

## 下一步

- 了解[功能总览](./features)
- 学习[小说创作](./novel)
- 查看[分镜生成](./storyboard)
