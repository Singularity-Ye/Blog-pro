---
tags:
  - weaveink/architecture
  - weaveink/leaf
  - weaveink/tech
parent: "[[WeaveInk：技术架构]]"
---

# LanceDB 向量存储 (LanceDB Vector Store)

WeaveInk 的嵌入索引层——为 [[RAG 上下文注入]] 提供毫秒级的语义检索能力。

## 为什么选 LanceDB

| 对比维度    | LanceDB  | Chroma   | Pinecone | Qdrant   |
| ------- | -------- | -------- | -------- | -------- |
| 部署      | 嵌入式（进程内） | 需 Docker | 云服务      | 需 Docker |
| 查询延迟    | < 10ms   | < 50ms   | < 100ms  | < 20ms   |
| MV 阶段成本 | 零        | 零        | $$       | $        |
| 数据格式    | Lance 列式 | SQLite   | 专有       | 专有       |

## 表设计

```python
import lancedb

db = lancedb.connect("./weaveink_data/lancedb")

# SettingNode 的向量表
db.create_table("settings", [
    {"id": "角色·林夜", "type": "character", "content_md": "...",
     "embedding": [0.1, 0.2, ...], "yaml_meta": {...}}
])

# ANN 索引加速检索
db["settings"].create_index(num_partitions=256)
```

## 嵌入更新管线

```
Obsidian Vault 文件变更
    │
    ▼
Watchdog 监听器 (watchfiles)
    │
    ▼
Hash diff → 仅重新嵌入变更的文件
    │
    ▼
LanceDB upsert (覆盖旧向量)
```
