---
title: Practice_提取左因子
english: "Example: Left Factoring Practice"
type: example
chapter_type: representative
aliases:
  - Left Factoring Practice
  - Practice Left Factoring
  - 提取左因子练习
source_chapter:
  - 4
used_in_chapter:
  - 4
tags:
  - 编译原理
  - 语法分析
  - 自顶向下
  - LL1
chapter: 4
area: top-down-parsing
topic:
  - LL(1)
  - left-factoring
  - grammar-transformation
  - predictive-parsing
source: practice
status: active
related_recipes:
  - "[[04_提取左因子套路]]"
related_concepts:
  - "[[左因子提取]]"
  - "[[LL(1)文法]]"
common_mistakes:
  - "[[99_Chapter4_自顶向下分析_易错点]]"
created: 2026-06-10
---
# Practice — 提取左因子 Left Factoring

## Original Question

<img src="../原题图片/Ch4_Practice_提取左因子_原题.png" alt="原题图片" width="650">

Left factor the following grammar:

```text
S → I | I - J | I + K
I → ( J - K ) | ( J )
J → K 1 | K 2
K → K 3 | ε
```

## 中文题意

对给定 grammar 进行 left factoring。把多个 productions 中的共同前缀提取出来，改写成更适合 predictive parsing / LL(1) parsing 的形式。

> ⚠️ 录入时核对原题图：`K 1`、`K 2`、`K 3` 是 nonterminal `K` 后跟 terminal `1`/`2`/`3`，还是整体 token `K1`/`K2`/`K3`。已核对原题图，此处为非终结符 `K` 后跟终结符 `1`/`2`/`3`。

---

## Artifacts & Images / 答案与原图归档

### 官方标准答案
<img src="../原题图片/Ch4_Practice_提取左因子_标准答案_01.png" alt="官方标准答案" width="650">

---

### 学生作答手稿
<img src="../我的答案图片/Ch4_Practice_提取左因子_我的答案_01.jpg" alt="我的解答" width="600">


## Type 题型

Grammar transformation / Left factoring

核心目标：

```text
Find common prefixes
↓
Factor out the common prefix
↓
Introduce new helper nonterminals
↓
Rewrite alternatives
```

## Related Concepts

- [[左因子提取|Left Factoring]] — 识别共同前缀并提取
- [[LL(1)文法|LL(1)]] — left factoring 的目标是让 grammar 接近 LL(1)
- lookahead token — 提取后 parser 只需一个 lookahead 就能做决定

## Related Recipes

- [[04_提取左因子套路]] — 识别条件 + 改写规则

---

## Step 1: 识别 S 的共同前缀

原 production：

```text
S → I | I - J | I + K
```

三个 alternatives 都以 `I` 开头。共同前缀是 `I`。

提取后：

```text
S  → I S'
S' → - J | + K | ε
```

其中 `S' → ε` 对应原来的 `S → I`（I 后面没有 `- J` 或 `+ K` 时直接结束）。

---

## Step 2: 识别 I 的共同前缀

原 production：

```text
I → ( J - K ) | ( J )
```

两个 alternatives 都以 `( J` 开头。共同前缀是 `( J`。

提取后：

```text
I  → ( J I'
I' → - K ) | )
```

- `I' → - K )` 对应原来的 `I → ( J - K )`
- `I' → )` 对应原来的 `I → ( J )`

---

## Step 3: 识别 J 的共同前缀

原 production：

```text
J → K 1 | K 2
```

两个 alternatives 都以 `K` 开头。共同前缀是 `K`。

提取后：

```text
J  → K J'
J' → 1 | 2
```

---

## Step 4: 识别 K — 注意，这不是 left factoring

原 production：

```text
K → K 3 | ε
```

这里不是普通的 left factoring 问题，而是 **left recursion**：

`K → K 3` 是直接左递归。

如果题目只要求 left factoring，可以保留原样。

如果目标是得到适合 LL(1) parsing 的 grammar，还需要消除左递归。

对 `K → K 3 | ε`，使用左递归消除公式（$A \to A\alpha \mid \beta$）：

```text
K  → K'
K' → 3 K' | ε
```

由于 $K \to K'$ 只是中转，也可以等价简化为：

```text
K → 3 K | ε
```

含义是：K 可以生成零个或多个 `3`。

---

## Final Answer

**只做 left factoring：**

```text
S  → I S'
S' → - J | + K | ε

I  → ( J I'
I' → - K ) | )

J  → K J'
J' → 1 | 2

K  → K 3 | ε
```

**进一步为 LL(1) 消除 K 的左递归：**

```text
S  → I S'
S' → - J | + K | ε

I  → ( J I'
I' → - K ) | )

J  → K J'
J' → 1 | 2

K  → 3 K | ε
```

> 新 nonterminal 命名不同不代表答案不同。`S'`/`V`、`I'`/`W`、`J'`/`Z` 本质等价，只要结构正确即可。

---

## Common Mistakes

→ [[99_Chapter4_自顶向下分析_易错点|Chapter 4 易错点]]

### 1. Left factoring ≠ Eliminating left recursion

| Left factoring | Eliminating left recursion |
|---|---|
| 处理共同前缀 $A \to \alpha\beta_1 \mid \alpha\beta_2$ | 处理左递归 $A \to A\alpha \mid \beta$ |

它们不是同一个问题，不要混用。

### 2. 忘记 $\varepsilon$ 分支

`S → I | I - J | I + K` 提取 `I` 后，必须保留原来的 `S → I`。

因此 `S' → - J | + K | ε` 中的 **$\varepsilon$ 不能漏**。

### 3. 不同 productions 不要用逗号分隔

```text
✗  S → I S', S' → - J | + K | ε
✓  分行写
```

---

## English Answer Patterns

> **说明 left factoring：** Left factoring is used when two or more productions share a common prefix.
>
> **提取共同前缀：** The productions for S share the common prefix I, so we factor out I and introduce a new nonterminal S'.
>
> **解释 ε：** The ε alternative represents the original production S → I.
>
> **说明 helper nonterminal：** The newly introduced nonterminal represents the remaining alternatives after the common prefix has been factored out.

---

## Reflection

这题真正考的是**能不能识别 common prefix**。

遇到 `A → αβ1 | αβ2 | αβ3`，不要急着算 FIRST / FOLLOW，先把共同前缀 α 提出来：

```text
A  → αA'
A' → β1 | β2 | β3
```

如果某个原 alternative 只有共同前缀本身（如 `S → I`），提取后一定要在新 nonterminal 中加入 $\varepsilon$。

本题最容易漏的是 **`S' → ε`**。

另外注意：原题如果只要求 left factoring，`K → K 3 | ε` 可以不动；但如果目标是 LL(1)，K 的左递归也要处理。**题目问什么，就做到什么，不要过度变形。**
