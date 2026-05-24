---
tags:
  - weaveink/architecture
  - weaveink/tech
aliases:
  - Tech Architecture
  - 技术架构
parent: "[[WeaveInk：项目总览]]"
---

# WeaveInk：技术架构

> **"织墨不是一座孤岛，而是一条精心编排的流水线。"**

---

## 全局架构图

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14)                  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 图谱面板      │  │ 编辑器面板    │  │ 巡检面板      │  │
│  │ D3.js/vis.js │  │ CodeMirror 6 │  │ Recharts     │  │
│  │ 双向链接可视  │  │ 实时 YAML 校 │  │ 冲突热力图    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │ REST / WebSocket            │
└───────────────────────────┼─────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────┐
│                    Backend (FastAPI)                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ API      │  │ 文档解析  │  │ RAG 调度 │  │ 巡检    │ │
│  │ Gateway  │  │ Pipeline │  │ Router   │  │ Engine  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│       │              │              │             │      │
│       │         ┌────┴────┐    ┌────┴────┐        │      │
│       │         │ YAML    │    │ 向量    │        │      │
│       │         │ Parser  │    │ 检索引擎│        │      │
│       │         └─────────┘    └─────────┘        │      │
│       │                                            │      │
└───────┼────────────────────────────────────────────┘      │
        │                                                   │
        ▼                                                   │
┌───────────────────────────────────────┐                   │
│   Data Layer                          │                   │
│  ┌──────────┐  ┌──────────────────┐  │                   │
│  │ Obsidian │  │  LanceDB         │  │                   │
│  │ Vault    │  │  (向量索引)       │  │                   │
│  │ (源文件)  │  │                  │  │                   │
│  └──────────┘  └──────────────────┘  │                   │
└───────────────────────────────────────┘                   │
```

---

## 技术选型详解

### [[Next.js 可视化前端]]

| 模块 | 技术 | 关键特性 |
|------|------|---------|
| 图谱渲染 | D3.js + vis.js | 力导向图 / 双向链接边 / 节点聚类 |
| Markdown 编辑器 | CodeMirror 6 | 语法高亮 / `[[wikilink]]` 自动补全 / YAML 校验 |
| 巡检面板 | Recharts + Tailwind | 冲突热力图 / 角色活跃度曲线 |
| 实时通信 | WebSocket (Socket.IO) | 分析进度推送 / 冲突实时告警 |
| 状态管理 | Zustand | 轻量 / TypeScript 友好 |

### [[FastAPI 数据管线]]

| 服务 | 端点 | 功能 |
|------|------|------|
| `POST /api/parse` | 文档解析 | 上传 `.md` → 解析 YAML + Wiki-link → JSON |
| `POST /api/rag/retrieve` | RAG 检索 | 上下文 + 实体列表 → Top-K 设定节点 |
| `POST /api/guard/check` | 设定守护 | 新内容 + 检索设定 → 冲突报告 |
| `GET /api/inspect/{scope}` | 图谱巡检 | 章节范围 → 巡检报告 JSON |
| `POST /api/generate` | AI 生成 | System Prompt + 用户输入 → Gemini 响应 |
| `WS /ws/progress` | 实时推送 | 分析任务进度 / 巡检状态 |

### [[Gemini API 认知引擎]]

```
Gemini 2.5 Pro 在 WeaveInk 中的三大角色：

1. 内容生成（创作模式）
   - 携带 RAG 检索到的设定 → 生成符合约束的新内容
   - 上下文窗口：2M Token（足够容纳全部活跃设定 + 历史上下文）

2. 结构化提取（解析模式）
   - 从自然语言段落中抽取人物、地点、事件结构化信息
   - 自动生成 YAML 元数据建议

3. 冲突分析（巡检模式）
   - 比较两段设定表述，判断是否存在语义矛盾
   - 输出冲突类型和置信度
```

### [[LanceDB 向量存储]]

```
选择 LanceDB 的理由（MVP 阶段）：
├── 嵌入式：无需独立部署，随 FastAPI 进程启动
├── 高性能：基于 Lance 列式格式，查询延迟 < 10ms
├── 兼容性：支持 OpenAI / Gemini / 本地 embedding 模型
└── 零运维：数据文件即数据库，适合个人创作者使用
```

---

## 数据模型 (Pydantic)

```python
class CharacterNode(BaseModel):
    id: str                    # "角色·林夜"
    name: str                  # "林夜"
    aliases: list[str]         # ["夜哥", "林公子"]
    status: str                # "重伤"
    attributes: dict           # {"age": 27, "weapon": "剑"}
    state_machine: dict        # {"health": "critical", "alive": True}
    first_appearance: str      # "第1章"
    last_appearance: str       # "第23章"
    relationships: list[dict]  # [{"target": "角色·陈雪", "type": "挚友"}]
    embedding: list[float]     # 768-dim vector

class SettingNode(BaseModel):
    id: str
    type: Literal["character", "location", "event", "item", "organization", "concept"]
    content_md: str            # Markdown 原始内容
    yaml_meta: dict            # YAML frontmatter
    embedding: list[float]
    out_links: list[str]       # [[wikilink]] 目标列表
    in_links: list[str]        # 引用此节点的文件列表
```

---

## 知识拓扑

```
[[WeaveInk：技术架构]]
├── [[Next.js 可视化前端]]
├── [[FastAPI 数据管线]]
├── [[Gemini API 认知引擎]]
├── [[LanceDB 向量存储]]
├── [[RAG 上下文注入]]          ← 核心技术依赖
├── [[设定守护者]]              ← 技术支撑
├── [[图谱剧情巡检]]            ← 技术支撑
└── [[WeaveInk：项目总览]]     ← 返回总纲
```
