---
tags: [博客网站, 项目, Obsidian, 图谱, 知识管理]
created: 2026-05-19
status: active
---

# 项目 - Obsidian 图谱整理

> 把 Obsidian 里的笔记结构化，用图谱展示节点关系。

## 设计目标

- 把 Obsidian 笔记结构化
- 用图谱展示节点关系
- 支持知识整理、旅游指南、小说编写
- 未来可接入 AI agent 读取节点内容

## 当前进展

### ✅ 活跃使用中

- 杭州旅游攻略：104 个 place 节点 + 10 个 route 节点
- 结构化数据可导出为 JSON
- [[Claudian]] 作为 Obsidian AI agent 协助维护

### 旅游笔记结构

```
杭州旅游攻略/
├── _规范/          # 范式定义
├── _规划/          # 路线规划报告
├── 景点/           # 40 个地点节点
├── 美食/           # 27 个地点节点
├── 活动/           # 37 个地点节点
└── 路线/           # 10 个路线节点
```

### 数据导出

- `places.generated.json` — 地点数据
- `routes.generated.json` — 路线数据
- `route-plan-suggestions.json` — 规划建议
- `route-quality-report.json` — 质量报告

## 相关关键词

Obsidian Graph View · 节点 · 双链 · sparse memory · agent · Claudian · 笔记整理

## 关联笔记

- [[03_生活簿（生活区）/行路志/_规范/旅游路线笔记规范]]
- [[02_丹炉间（项目区）/松果屋·博客/图谱页/Obsidian笔记图谱]]
- [[02_丹炉间（项目区）/松果屋·博客/设计总览]]
