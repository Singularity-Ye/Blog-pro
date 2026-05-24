---
tags:
  - weaveink/meta
  - weaveink/devlog
aliases:
  - DevLog
  - 开发日志
parent: "[[WeaveInk：项目总览]]"
created: 2026-04-30
---

# WeaveInk：开发日志

> **"每一个 commit 都是一根丝线，编织成墨色的锦缎。"**

---

## 开发路线图

```
P0 ──── P1 ──── P2 ──── P3 ──── P4
织机     纺锤     梭子     织锦     守护者
Loom    Spindle  Shuttle  Tapestry Loomkeeper
──────────────────────────────────────────→
```

| 阶段 | 代号 | 目标 | 状态 | 关键交付物 |
|------|------|------|------|-----------|
| **P0** | `Loom` | Obsidian Vault 结构解析 | ⬜ 未开始 | YAML 抽取器、Wiki-link 索引器 |
| **P1** | `Spindle` | RAG 检索管线 MVP | ⬜ 未开始 | 嵌入生成 Pipeline、LanceDB 索引 |
| **P2** | `Shuttle` | Gemini 上下文注入闭环 | ⬜ 未开始 | System Prompt 编织器、约束冲突检测 |
| **P3** | `Tapestry` | Next.js 可视化前端 | ⬜ 未开始 | 图谱渲染、编辑器面板、巡检报告 |
| **P4** | `Loomkeeper` | 端到端集成 + 巡检 | ⬜ 未开始 | 时间线冲突检测、雪藏告警 |

---

## P0 技术准备清单

- [ ] 创建 Obsidian Vault 测试仓库（含 5 章示例 + 10 个设定节点）
- [ ] 实现 YAML Frontmatter 解析器（Python）
- [ ] 实现 `[[wikilink]]` 正则提取器
- [ ] 实现 Markdown → SettingNode Pydantic 模型转换
- [ ] 单元测试：解析器对边界情况的处理

## P1 技术准备清单

- [ ] 选择 embedding 模型（Gemini text-embedding-004 或 BGE-M3）
- [ ] 搭建 LanceDB 本地存储
- [ ] 实现批量嵌入生成管线
- [ ] 实现向量检索 API (`POST /api/rag/retrieve`)
- [ ] 性能基准测试：10K 节点检索延迟 < 100ms

---

## 架构决策记录 (ADR)

| ID | 日期 | 决策 | 理由 |
|----|------|------|------|
| ADR-001 | 2026-04-30 | 选择 LanceDB 而非 Chroma | 嵌入式架构、无需 Docker、个人创作者友好 |
| ADR-002 | 2026-04-30 | 使用 JSON 而非 YAML 作为 API 传输格式 | Pydantic 天然兼容、前端解析零成本 |
| ADR-003 | 2026-04-30 | 上下文预算分配 20-60-20 | 经计算 2M Token 窗口下，60% 可容纳约 20 个完整角色设定 |

---

## 知识拓扑

```
[[WeaveInk：开发日志]]
├── [[WeaveInk：项目总览]]     ← 总纲
├── [[WeaveInk：技术架构]]     ← 实施方案
├── [[设定守护者]]              ← P2-P4 核心模块
├── [[RAG 上下文注入]]          ← P1-P2 核心模块
└── [[WeaveInk：创作流协议]]    ← 规范约束
```
