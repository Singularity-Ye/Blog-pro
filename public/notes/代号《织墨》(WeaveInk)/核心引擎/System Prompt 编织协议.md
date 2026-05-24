---
tags:
  - weaveink/architecture
  - weaveink/leaf
  - weaveink/rag
parent: "[[RAG 上下文注入]]"
---

# System Prompt 编织协议 (System Prompt Weaving Protocol)

将从 [[向量检索路由]] 检索到的结构化设定节点，组装为 Gemini API 能够理解并严格执行的 System Prompt 模板。

## 编织模板

```
System: 你是 WeaveInk 创作引擎的生成模块。你必须严格遵守以下「当前有效设定」中的每一
条约束。如果用户的写作方向与设定矛盾，你必须明确指出冲突。

## 当前有效设定 (RAG 检索 + 邻域展开)

{for each retrieved node:}
### {node.type}: {node.name}
{node.content_summary}
- 关键约束: {node.constraints}

## 写作指令
1. 保持与「当前有效设定」的完全一致性
2. 如果设定中存在不确定性（未声明的细节），可以自由发挥但需标注为 [推测]
3. 如果检测到与设定的矛盾，以以下格式输出警告：
   ⚠️ [设定冲突] {冲突描述} | 涉及设定: {设定节点} | 建议: {修复方案}
```

## 节点序列化格式

从 Markdown 节点到 Prompt 片段的转换规则：

- **角色节点** → 提取 `status`, `attributes`, `constraints` 字段
- **地点节点** → 提取 `status`, `description` 字段
- **事件节点** → 提取 `timestamp`, `effects`, `significance` 字段

## 约束注入顺序

1. 世界观规则（全局、最高优先级）
2. 角色状态（当前活跃角色）
3. 地点约束（当前场景所在位置）
4. 历史事件（相关的已发生事件）
5. 伏笔（未回收的线索）
