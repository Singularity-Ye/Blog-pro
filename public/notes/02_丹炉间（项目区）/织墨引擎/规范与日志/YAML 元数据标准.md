---
tags:
  - weaveink/meta
  - weaveink/usage
parent: "[[WeaveInk：创作流协议]]"
---

# YAML 元数据标准 (YAML Metadata Standard)

WeaveInk 的结构化数据层协议——所有设定节点的 YAML Frontmatter 字段规范。

## 通用字段（所有节点类型）

```yaml
---
tags: [character / location / event / item / organization / concept]
aliases: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active / archived / deprecated
---
```

## 类型专属字段

### 角色 (Character)
```yaml
health: [healthy, wounded, critical, dead]
weapon: 主要武器
affiliation: "[[组织·XXX]]"
relationships:
  - target: "[[角色·XXX]]"
    type: [挚友, 师徒, 恋人, 敌对, 中立]
    strength: 0.0-1.0  # 关系强度
```

### 事件 (Event)
```yaml
timestamp: 作品内时间轴
participants: ["[[角色·]]", "[[组织·]]"]
location: "[[地点·]]"
causes: ["[[事件·]]"]
effects: ["[[事件·]]"]
significance: [主线转折点, 支线, 伏笔, 背景]
```

## 校验规则
- `timestamp` 若为中文格式（"永安三年·三月"），需额外提供 CTI (Canonical Timeline Index) 数值
- `relationships` 必须双向引用（A 声明了与 B 的关系，B 也必须声明与 A 的关系）
