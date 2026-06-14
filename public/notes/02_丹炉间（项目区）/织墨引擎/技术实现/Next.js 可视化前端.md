---
tags:
  - weaveink/architecture
  - weaveink/leaf
  - weaveink/tech
parent: "[[WeaveInk：技术架构]]"
---

# Next.js 可视化前端 (Next.js Visualization Frontend)

WeaveInk 的用户界面层——创作者直接交互的可视化工作台。

## 三大面板

### 1. 图谱面板 (Graph Panel)
- **渲染引擎**：D3.js 力导向图 + vis.js 网络拓扑
- **节点**：圆形 = 角色，方形 = 事件，菱形 = 地点
- **边**：实线 = 直接引用，虚线 = RAG 关联，红色 = 冲突
- **交互**：拖拽、缩放、点击展开 n-hop 邻域

### 2. 编辑器面板 (Editor Panel)
- **编辑器**：CodeMirror 6（Markdown 语法高亮 + `[[wikilink]]` 自动补全）
- **实时预览**：右侧同步渲染
- **守护者 Hint**：行号旁显示 🟡🟠🔴 彩色冲突标记

### 3. 巡检面板 (Inspection Panel)
- **热力图**：各章节的设定一致性得分
- **角色活跃度曲线**：折线图展示每个角色的出场频率
- **告警列表**：按严重度排序的冲突/警告/提示

## 技术选型

| 需求 | 选型 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14+ |
| 样式 | Tailwind CSS + shadcn/ui | v3 |
| 状态管理 | Zustand | v4 |
| 实时通信 | Socket.IO Client | v4 |
| 可视化 | D3.js + vis-network | latest |
