---
title: 00_Chapter5_自底向上分析_题型总览
english: Chapter 5 Bottom-Up Parsing Problem Type Index
type: chapter-index
aliases:
  - Chapter 5 自底向上分析题型总览
  - Chapter 5 Bottom-Up Parsing Problem Type Index
source_chapter:
  - 5
used_in_chapter:
  - 5
tags:
  - 编译原理
  - 语法分析
  - 自底向上
  - LR
  - SLR
---

# Chapter 5 — 自底向上分析题型总览

## 核心题型

| # | 题型 | 套路文件 | 状态 |
|---|------|---------|------|
| 1 | LR(0) 项目集规范族构造 | [[01_LR0项目集规范族构造套路]] | 已建骨架 |
| 2 | SLR 分析表构造 | [[02_SLR分析表构造套路]] | 已建骨架 |
| 3 | SLR 分析过程追踪 | [[03_SLR分析过程追踪套路]] | 已建骨架 |
| 4 | 判断文法不是 LR(0) 或 SLR(1) | [[04_判断文法不是LR0或SLR1套路]] | 已建骨架 |

## 关联知识点

- [[自底向上语法分析]]
- [[增广文法]]
- [[LR(0)项目]] / [[闭包运算]] / [[跳转函数]] / [[项目集规范族]]
- [[ACTION表]] / [[GOTO表]]
- [[LR(0)分析算法]] / [[SLR(1)分析算法|SLR(1)]]
- [[移进]] / [[归约]]
- [[移进-归约冲突]] / [[归约-归约冲突]]
- [[FOLLOW集合|FOLLOW 集合]]

## 代表例题

- [[Ex5_SLR综合题_括号文法]]
- [[Ex5.2_SLR分析与LR0冲突_空产生式文法]]

## 易错点

- [[99_Chapter5_自底向上分析_易错点|Chapter 5 易错点]]