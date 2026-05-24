---
tags:
  - weaveink/architecture
  - weaveink/leaf
  - weaveink/tech
parent: "[[WeaveInk：技术架构]]"
---

# Gemini API 认知引擎 (Gemini Cognitive Engine)

WeaveInk 的大脑——基于 Gemini 2.5 Pro 的三重认知模式。

## 三大认知模式

### 1. 创作模式 (Generate Mode)
- 输入：System Prompt（含 RAG 检索约束） + 上文 + 用户指令
- 输出：符合设定的下一段正文
- 关键配置：`temperature=0.7`, `top_p=0.95`

### 2. 解析模式 (Extract Mode)
- 输入：自然语言段落
- 输出：结构化 JSON → YAML 元数据建议
- 关键配置：`temperature=0.1`（低温度 = 更确定性的结构化输出）
- System Prompt 模板：
  ```
  从以下文本中提取人物、地点、事件信息。
  输出 JSON 格式：{characters: [], locations: [], events: []}
  ```

### 3. 巡检模式 (Inspect Mode)
- 输入：两段设定描述（如旧版和新版）
- 输出：`{conflict: bool, severity: 0-1, detail: str}`
- 关键配置：`temperature=0.0`

## API 调用最佳实践

- 使用 `safety_settings` 关闭不必要的内容过滤（小说创作需要更大的自由度）
- 流式响应 (`stream=True`) 传递到 WebSocket 推送到前端
- Context Caching 优化：对于高频角色设定，缓存 System Prompt Token 以减少重复计费
