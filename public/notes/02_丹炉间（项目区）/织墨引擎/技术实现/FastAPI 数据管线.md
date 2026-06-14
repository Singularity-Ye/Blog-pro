---
tags:
  - weaveink/architecture
  - weaveink/leaf
  - weaveink/tech
parent: "[[WeaveInk：技术架构]]"
---

# FastAPI 数据管线 (FastAPI Data Pipeline)

WeaveInk 的后端中枢——负责所有数据处理、API 调度与对外接口。

## API 端点总览

| 方法 | 端点 | 功能 | 响应 |
|------|------|------|------|
| `POST` | `/api/parse` | 解析 `.md` 文件 | `SettingNode` JSON |
| `POST` | `/api/rag/retrieve` | RAG 检索 | Top-K 设定节点列表 |
| `POST` | `/api/guard/check` | 设定约束校验 | 冲突报告 |
| `GET` | `/api/inspect/{scope}` | 图谱巡检 | 巡检报告 JSON |
| `POST` | `/api/generate` | AI 生成 | Gemini 流式响应 |
| `WS` | `/ws/progress` | 实时进度推送 | 分析进度百分比 |

## 中间件栈

```
Request → CORS Middleware → Rate Limiter → Auth → Router → Service → Response
```

## 核心依赖

```txt
fastapi==0.110+
uvicorn[standard]==0.27+
pydantic==2.6+
networkx==3.2+
lancedb==0.6+
google-generativeai==0.5+
```
