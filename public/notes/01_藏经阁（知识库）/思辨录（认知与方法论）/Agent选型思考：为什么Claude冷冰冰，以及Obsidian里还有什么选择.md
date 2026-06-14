---
tags:
  - agent
  - obsidian
  - AI工具
  - 模型对比
aliases:
  - Agent选型
  - Claude vs Gemini
  - Obsidian Agent插件
created: 2026-05-29
status: permanent
---

# Agent 选型思考：为什么 Claude Code 冷冰冰，以及 Obsidian 里还有什么选择

## 一个观察

Antigravity 调用的 Claude 模型很活泼、很亲近。但同一个模型在 Claude Code 里就变成了一台冷冰冰的代码机器——回一句话、不解释、不闲聊。这不是模型本身的问题，是产品和系统指令的差异。

**Claude Code 的底层 System Prompt 是硬编码在客户端源码里的，优先级极高，用户写的 CLAUDE.md 盖不过去。** 它的定位是 CLI 终端开发工具，追求速度、低 Token、不刷屏。为此 Anthropic 在系统层加了"禁止闲聊""极度简练""除非被要求否则不解释代码"这类限制。这解释了为什么 Claudian 在 Obsidian 里帮你整理笔记时可以有温度，但在终端里写代码时立刻变哑巴。

**Gemini 的原生对齐训练就偏"对话感"和"亲和力"。** 而 Antigravity 作为一个 Agent 框架，它的 System Prompt 定位是"结对编程的伙伴"，强调协同、理解和陪伴。所以即便底层调同一个模型，Agent 层叠加的语气差异也很明显。

这引出一个更实际问题：**如果我想在 Obsidian 里有一个既能读写笔记、又能接入 DeepSeek、又不冷冰冰的 Agent，有哪些选择？**

---

## Obsidian Agent 插件对比

| 插件 | 定位 | DeepSeek 支持 | Agent 能力 | 亮点 |
|------|------|:--:|------|------|
| **Smart Note Agent** | 多步骤任务 Agent | ✅ OpenAI 兼容接口 | 搜索、读取、整合、创建文件 | 最推荐的 DeepSeek 兼容方案 |
| **OpenAgent** | 极简读写 Agent | ✅ 自定义接口 | 文件读写、选中文本就地改写 | 支持任何 Function Calling 模型 |
| **Copilot for Obsidian** | 日常聊天辅助 | ✅ 自定义模型 | 根据笔记内容回答问题、写草稿 | 界面最精美，右上角一键切模型 |
| **Gemini Scribe** | Gemini 原生 Agent | ❌ 仅 Gemini/Ollama | 读取多笔记、创建新文件、格式化 | 保留了 Gemini 的温和沟通风格 |

---

## 各自的适用场景

**Smart Note Agent**——你需要 AI 自动完成多步骤任务。比如"帮我阅读最近三天的日记，在 Inbox 下生成周报"。它会自己调用搜索工具、读取文件、整合内容、创建新文件。DeepSeek 支持最完善。

**OpenAgent**——你需要最小化的 Agent 框架。不花哨，就是给模型文件读写权限。适合"选中这段文字，帮我重写"或"在当前文件夹新建一篇笔记"这类原子操作。

**Copilot for Obsidian**——你主要的交互是"跟 AI 聊 Vault 里的内容"而不是"让 AI 自动批量创建文件"。界面体验最好，切换模型最方便，自定义 System Prompt 可以随时调整性格。

**Gemini Scribe**——你喜欢 Gemini 的对话风格，且不需要自定义模型。实测无法接入 DeepSeek，Custom API Endpoint 不兼容 OpenAI 格式。

---

## 我的选择方向

当前用的是 Claude Code（Claudian），优点是对 vault 结构的理解深度最好，缺点是冷、且只能用它自己的模型。接下来可以试试两条路：

1. **Claude Code + Copilot 双持**——日常聊天和快速提问用 Copilot + DeepSeek，深度整理和复杂任务仍交给 Claudian
2. **Smart Note Agent 替代 Claudian**——如果它能在理解 vault 结构和文风匹配上达到接近水平，那 DeepSeek 的性价比+温和语气就是巨大优势

起步计划：先装 Copilot，配 DeepSeek，感受一下"右上角一键切模型 + 自定义 System Prompt"的体验。如果不满足于纯聊天，再试 Smart Note Agent 的自动任务能力。

---

> 结论：Claude Code 的冷是产品设计，不是模型缺陷。在 Obsidian 里，Copilot + Smart Note Agent 两件套可能比单一 Claude Code 更适合既要能力又要温度的日常使用。
