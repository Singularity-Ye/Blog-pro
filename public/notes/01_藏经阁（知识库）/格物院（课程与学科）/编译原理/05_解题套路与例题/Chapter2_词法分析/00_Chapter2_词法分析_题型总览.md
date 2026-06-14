---
title: 00_Chapter2_词法分析_题型总览
english: Chapter 2 Scanning Problem Type Index
type: chapter-index
aliases:
  - Chapter 2 Scanning Problem Type Index
  - Chapter 2 词法分析题型总览
  - Chapter 2 词法分析题型索引
  - Chapter2_词法分析_题型总览
source_chapter:
  - 2
used_in_chapter:
  - 2
tags:
  - 编译原理
  - 词法分析
  - 题型总览
status: complete
created: 2026-06-13
---
# Chapter 2 — 词法分析题型总览

> Chapter 2 覆盖词法分析与有限自动机的全部核心。考试围绕正规式、NFA与DFA的相互转换及DFA化简展开。

---

## 核心题型与套路

| # | 题型 | 套路文件 | 考试频率 | 核心要点 |
|---|---|---|---|---|
| 1 | 正规式转 NFA 与 DFA | [[01_正规式转NFA与DFA套路]] | ★★★★★ | 利用 Thompson 算法构造 NFA，使用子集构造法（$\varepsilon$-closure / move）把 NFA 转换为等价 DFA。 |
| 2 | DFA 状态最小化 | [[02_DFA状态最小化套路]] | ★★★★★ | 使用 Hopcroft 算法（或等价划分法），通过对状态集不断进行 Refine 裂分，合并等价状态，消除冗余。 |
| 3 | 正规式与状态机设计 | (见代表例题) | ★★★★☆ | 根据自然语言描述构造特定规则的正规式，或者直接绘制识别特定模式的 DFA（如奇偶校验校验、共享前缀关键字）。 |

---

## 关联知识点

- [[NFA]] / [[DFA]] — 有限自动机的基本定义与区别
- [[子集构造法]] — 从 NFA 到 DFA 的理论支撑
- [[NFA与DFA典型结构对照（从分头试探到单线直达）]] — Thompson 连线与 DFA 的视觉化映射
- [[DFA最小化]] — 优化分析器内存的 Hopcroft 算法机制

---

## 复习优先级

```text
必拿分：02 DFA 最小化 + 01 正规式转 NFA 与 DFA
易丢分：复杂正则表达式设计 (如奇偶校验、特定前后缀冲突)
保底分：子集构造法表格填制
```

---

## 代表例题

- [[Ex2.1_正规式构造]] — 偶数个 a 且偶数个 b 等经典奇偶校验状态机与正规式构造
- [[Ex2.2_正规式语言描述]] — 正规表达式与自然语言描述逆向分析及边界限制
- [[Ex2.9_DFA构造]] — Tiny-C 关键字共享前缀树 DFA 构造
- [[Ex2.12_正规式转NFA与DFA]] — 完整 Thompson 构造与 3 状态化简 DFA
- [[Ex2.14_子集构造]] — NFA 转 DFA 子集构造法应用及初态闭包易错点
- [[Ex2.16_DFA状态最小化]] — DFA 状态最小化算法（Hopcroft）应用与接受态分类技巧

---

## 易错点

- [[99_Chapter2_词法分析_易错点|Chapter 2 易错点]]
