---
title: Ex4.8_LL1综合题
english: "Example: LL(1) Comprehensive Problem"
type: example
chapter_type: representative
aliases:
  - Ex4.8
  - Exercise 4.8
  - LL(1) Comprehensive Problem
  - LL1综合题
source_chapter:
  - 4
used_in_chapter:
  - 4
tags:
  - 编译原理
  - 语法分析
  - 自顶向下
  - LL1
related_concepts:
  - LL(1)
  - FIRST集合
  - FOLLOW集合
  - LL(1)分析表
  - 左递归
  - ParserTrace
related_recipes:
  - 02_LL1综合题套路
  - 05_消除左递归套路
  - 01_LL1分析过程追踪套路
status: complete
created: 2026-06-10
---

# Ex4.8 LL(1) 综合题

## Original Question

Consider the grammar:
```text
lexp      → atom | list
atom      → number | identifier
list      → ( lexp-seq )
lexp-seq  → lexp-seq lexp | lexp
```

*   **a.** Remove the left recursion.
*   **b.** Construct FIRST and FOLLOW sets for the nonterminals of the resulting grammar.
*   **c.** Show that the resulting grammar is LL(1).
*   **d.** Construct the LL(1) parsing table for the resulting grammar.
*   **e.** Show the actions of the corresponding LL(1) parser, given the input string: `(a (b (2)) (c))`

---

## 中文题意

**4.8** 给定一个类似 Lisp 表达式的文法，要求完成一整套 LL(1) 分析流程：

*   **a.** 消除直接左递归。
*   **b.** 对消除左递归后的文法计算 `FIRST` 和 `FOLLOW` 集合。
*   **c.** 证明改写后的文法是 LL(1) 文法。
*   **d.** 构造对应的 LL(1) 分析表。
*   **e.** 对输入串 `(a (b (2)) (c))` 展示 LL(1) 分析栈的 40 步原子动作追踪过程。

---

## Type 题型

LL(1) 文法判定 / 消除左递归 / FIRST与FOLLOW集合计算 / LL(1) 分析表构造 / 分析器动作追踪模拟

---

## Related Concepts

- [[LL(1)文法]]
- [[FIRST集合]]
- [[FOLLOW集合]]
- [[LL(1)预测分析表（自顶向下分析的方向指示牌）|LL(1)分析表]]
- [[左递归]]
- [[02_LL1综合题套路]]
- [[05_消除左递归套路]]
- [[01_LL1分析过程追踪套路]]

---

## Artifacts & Images / 答案与原图归档

| 我的手写解答草稿 | 教材官方标准答案 |
| :---: | :---: |
| <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ch4_LL1%E7%BB%BC%E5%90%88%E9%A2%98_Ex4.8_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_01.png" width="220"> <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ch4_LL1%E7%BB%BC%E5%90%88%E9%A2%98_Ex4.8_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_02.png" width="220"> <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ch4_LL1%E7%BB%BC%E5%90%88%E9%A2%98_Ex4.8_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_03.png" width="220"> | <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E5%8E%9F%E9%A2%98%E5%9B%BE%E7%89%87/Ch4_LL1%E7%BB%BC%E5%90%88%E9%A2%98_Ex4.8_%E6%A0%87%E5%87%86%E7%AD%94%E6%A1%88_01.png" width="340"> <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E5%8E%9F%E9%A2%98%E5%9B%BE%E7%89%87/Ch4_LL1%E7%BB%BC%E5%90%88%E9%A2%98_Ex4.8_%E6%A0%87%E5%87%86%E7%AD%94%E6%A1%88_02.png" width="340"> |

---

## ⚠️ 真实考场还原与作答深度对比

我们将 **学生作答手稿（图左）** 与 **官方标准答案（图右）** 进行逐一比对和深度学术剖析，发现在实际阅卷中，学生最容易在以下 4 个小节中被扣除分数：

### 1. FOLLOW 集合书写缺乏集合符号 `{ }` (最基础失分点 ❌)
*   **手稿问题**：写成了 `FOLLOW(lexp-seq') = )` 的字符形式。
*   **正解规范**：必须书写为 `FOLLOW(lexp-seq') = { ) }`。
*   **警示**：`FOLLOW` 是个终结符的**集合（Set）**。即使集合内仅含有一个字符，也必须用花括号 `{ }` 进行数学描述，写成单字符会被严厉扣分。

### 2. 分析表中遗漏 `$` 列或额外添加 $\varepsilon$ 列
*   **手稿问题**：很多同学在画分析表时，由于输入串中无 `$`，就漏掉了 `$` 列；或者因为文法含有空产生式，就列出了 $\varepsilon$ 列。
*   **正解规范**：
    *   分析表的列首代表输入 Token，**必须包含输入结束符 `$`**，因为分析器在匹配完成时需要利用 `$` 单元格填入 `accept` 动作。
    *   分析表**绝对不能画 $\varepsilon$ 列**。$\varepsilon$-production 是通过非终结符的 `FOLLOW` 集合成员填入其对应普通终结符列下的。

### 3. 错把 $\varepsilon$-production 填入了 `$` 单元格
*   **手稿问题**：在 `lexp-seq'` 行的 `$` 列中，填入了 `lexp-seq' → ε`。
*   **正解规范**：只有当 `$` 属于该非终结符的 `FOLLOW` 集合时，才可以填入空转移。由于本题 $\text{FOLLOW}(lexp\text{-}seq') = \{ ) \}$ 并不包含 `$`，故 `$` 单元格应留空。`lexp-seq' → ε` 只能且必须填在 `)` 列。

### 4. 动作追踪（Parser Trace）中多步动作合并在同一行
*   **手稿问题**：将 `lexp → atom` 和 `atom → identifier` 合并为一步输出。
*   **正解规范**：LL(1) 分析属于严格的物理栈模拟，每一步必须是**原子动作（Atomic Action）**。替换与匹配动作绝对不能合并，必须严格一行执行一个动作（详见标准答案表格的 40 步拆解）。

---

## Standard Solution 标准答案

### 1. part (a) 消除直接左递归

原产生式中，`lexp-seq → lexp-seq lexp | lexp` 存在直接左递归。
利用公式 $A \to A\alpha \mid \beta \Longrightarrow A \to \beta A', A' \to \alpha A' \mid \varepsilon$ 改写：
*   $A = lexp\text{-}seq$
*   $\alpha = lexp$
*   $\beta = lexp$

消除左递归后的等价文法 $G'[lexp]$ 为：
$$
\begin{aligned}
lexp &\to atom \mid list \\
atom &\to number \mid identifier \\
list &\to (\ lexp\text{-}seq\ ) \\
lexp\text{-}seq &\to lexp\ lexp\text{-}seq' \\
lexp\text{-}seq' &\to lexp\ lexp\text{-}seq' \mid \varepsilon
\end{aligned}
$$

---

### 2. part (b) 计算 FIRST 与 FOLLOW 集合

| 非终结符 | $\text{FIRST}$ 集合 | $\text{FOLLOW}$ 集合 |
| :---: | :--- | :--- |
| **lexp** | $\{ number, identifier, ( \}$ | $\{ number, identifier, (, ), \text{＄} \}$ |
| **atom** | $\{ number, identifier \}$ | $\{ number, identifier, (, ), \text{＄} \}$ |
| **list** | $\{ ( \}$ | $\{ number, identifier, (, ), \text{＄} \}$ |
| **lexp-seq** | $\{ number, identifier, ( \}$ | $\{ ) \}$ |
| **lexp-seq'** | $\{ number, identifier, (, \varepsilon \}$ | $\{ ) \}$ |

> [!TIP] FOLLOW(lexp) 计算细节
> *   `lexp` 作为文法开始符号，首先将 `$` 放入 $\text{FOLLOW}(lexp)$。
> *   在 $list \to (\ lexp\text{-}seq\ )$ 中，`lexp-seq` 后紧跟 `)`，因此 $\text{FOLLOW}(lexp\text{-}seq) = \{ ) \}$。
> *   在 $lexp\text{-}seq \to lexp\ lexp\text{-}seq'$ 中，`lexp` 后面跟着 `lexp-seq'`，所以 $\text{FOLLOW}(lexp)$ 包含 $\text{FIRST}(lexp\text{-}seq') \setminus \{\varepsilon\} = \{ number, identifier, ( \}$。
> *   另外，因为 $lexp\text{-}seq' \Rightarrow^* \varepsilon$，根据规则，$\text{FOLLOW}(lexp)$ 还必须包含左部 $\text{FOLLOW}(lexp\text{-}seq) = \{ ) \}$。
> *   综上：$\text{FOLLOW}(lexp) = \{ number, identifier, (, ), \text{＄} \}$。

---

### 3. part (c) LL(1) 文法严格判定证明

要证明一个文法是 LL(1) 的，必须满足以下两个条件：
1.  对于任一非终结符 $A$，若其有多个产生式 $A \to \alpha_1 \mid \alpha_2 \mid \dots \mid \alpha_n$，则它们的 $\text{FIRST}$ 集合两两不相交：
    $$
    \text{FIRST}(\alpha_i) \cap \text{FIRST}(\alpha_j) = \varnothing \quad (i \neq j)
    $$
2.  若 $\varepsilon \in \text{FIRST}(A)$，则 $\text{FIRST}(A) \cap \text{FOLLOW}(A) = \varnothing$。

**校验过程**：
*   对于 $lexp \to atom \mid list$：
    $$
    \text{FIRST}(atom) \cap \text{FIRST}(list) = \{ number, identifier \} \cap \{ ( \} = \varnothing \quad \text{(满足)}
    $$
*   对于 $atom \to number \mid identifier$：
    $$
    \text{FIRST}(number) \cap \text{FIRST}(identifier) = \{ number \} \cap \{ identifier \} = \varnothing \quad \text{(满足)}
    $$
*   对于 $lexp\text{-}seq' \to lexp\ lexp\text{-}seq' \mid \varepsilon$：
    其第一项候选式首符集含 $\varepsilon$，需要计算：
    $$
    \text{FIRST}(lexp\ lexp\text{-}seq') \cap \text{FOLLOW}(lexp\text{-}seq') = \{ number, identifier, ( \} \cap \{ ) \} = \varnothing \quad \text{(满足)}
    $$

所有非终结符均满足 LL(1) 判定标准，因此该改写文法是 **LL(1) 文法**。

---

### 4. part (d) 构造 LL(1) 分析表

| 非终结符 | $number$ | $identifier$ | $($ | $)$ | $\text{＄}$ |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **lexp** | $lexp \to atom$ | $lexp \to atom$ | $lexp \to list$ | | |
| **atom** | $atom \to number$ | $atom \to identifier$ | | | |
| **list** | | | $list \to (\ lexp\text{-}seq\ )$ | | |
| **lexp-seq** | $lexp\text{-}seq \to lexp\ lexp\text{-}seq'$ | $lexp\text{-}seq \to lexp\ lexp\text{-}seq'$ | $lexp\text{-}seq \to lexp\ lexp\text{-}seq'$ | | |
| **lexp-seq'** | $lexp\text{-}seq' \to lexp\ lexp\text{-}seq'$ | $lexp\text{-}seq' \to lexp\ lexp\text{-}seq'$ | $lexp\text{-}seq' \to lexp\ lexp\text{-}seq'$ | $lexp\text{-}seq' \to \varepsilon$ | |

---

### 5. part (e) 40步分析器动作追踪 (Parser Trace)

输入串为 `(a (b (2)) (c))`，Token 化为：
`( identifier ( identifier ( number ) ) ( identifier ) ) $`

| 步骤 | Parsing Stack | Input | Action |
| :---: | :--- | :--- | :--- |
| 1 | `$ lexp` | `( a ( b ( 2 ) ) ( c ) ) $` | `lexp → list` |
| 2 | `$ list` | `( a ( b ( 2 ) ) ( c ) ) $` | `list → ( lexp-seq )` |
| 3 | `$ ) lexp-seq (` | `( a ( b ( 2 ) ) ( c ) ) $` | `match` (匹配左括号 `(`) |
| 4 | `$ ) lexp-seq` | `a ( b ( 2 ) ) ( c ) ) $` | `lexp-seq → lexp lexp-seq'` |
| 5 | `$ ) lexp-seq' lexp` | `a ( b ( 2 ) ) ( c ) ) $` | `lexp → atom` |
| 6 | `$ ) lexp-seq' atom` | `a ( b ( 2 ) ) ( c ) ) $` | `atom → identifier` |
| 7 | `$ ) lexp-seq' identifier` | `a ( b ( 2 ) ) ( c ) ) $` | `match` (匹配标示符 `a`) |
| 8 | `$ ) lexp-seq'` | `( b ( 2 ) ) ( c ) ) $` | `lexp-seq' → lexp lexp-seq'` |
| 9 | `$ ) lexp-seq' lexp` | `( b ( 2 ) ) ( c ) ) $` | `lexp → list` |
| 10 | `$ ) lexp-seq' list` | `( b ( 2 ) ) ( c ) ) $` | `list → ( lexp-seq )` |
| 11 | `$ ) lexp-seq' ) lexp-seq (` | `( b ( 2 ) ) ( c ) ) $` | `match` (匹配左括号 `(`) |
| 12 | `$ ) lexp-seq' ) lexp-seq` | `b ( 2 ) ) ( c ) ) $` | `lexp-seq → lexp lexp-seq'` |
| 13 | `$ ) lexp-seq' ) lexp-seq' lexp` | `b ( 2 ) ) ( c ) ) $` | `lexp → atom` |
| 14 | `$ ) lexp-seq' ) lexp-seq' atom` | `b ( 2 ) ) ( c ) ) $` | `atom → identifier` |
| 15 | `$ ) lexp-seq' ) lexp-seq' identifier` | `b ( 2 ) ) ( c ) ) $` | `match` (匹配标示符 `b`) |
| 16 | `$ ) lexp-seq' ) lexp-seq'` | `( 2 ) ) ( c ) ) $` | `lexp-seq' → lexp lexp-seq'` |
| 17 | `$ ) lexp-seq' ) lexp-seq' lexp` | `( 2 ) ) ( c ) ) $` | `lexp → list` |
| 18 | `$ ) lexp-seq' ) lexp-seq' list` | `( 2 ) ) ( c ) ) $` | `list → ( lexp-seq )` |
| 19 | `$ ) lexp-seq' ) lexp-seq' ) lexp-seq (` | `( 2 ) ) ( c ) ) $` | `match` (匹配左括号 `(`) |
| 20 | `$ ) lexp-seq' ) lexp-seq' ) lexp-seq` | `2 ) ) ( c ) ) $` | `lexp-seq → lexp lexp-seq'` |
| 21 | `$ ) lexp-seq' ) lexp-seq' ) lexp-seq' lexp` | `2 ) ) ( c ) ) $` | `lexp → atom` |
| 22 | `$ ) lexp-seq' ) lexp-seq' ) lexp-seq' atom` | `2 ) ) ( c ) ) $` | `atom → number` |
| 23 | `$ ) lexp-seq' ) lexp-seq' ) lexp-seq' number` | `2 ) ) ( c ) ) $` | `match` (匹配数字 `2`) |
| 24 | `$ ) lexp-seq' ) lexp-seq' ) lexp-seq'` | `) ) ( c ) ) $` | `lexp-seq' → ε` |
| 25 | `$ ) lexp-seq' ) lexp-seq' )` | `) ) ( c ) ) $` | `match` (匹配右括号 `)`) |
| 26 | `$ ) lexp-seq' ) lexp-seq'` | `) ( c ) ) $` | `lexp-seq' → ε` |
| 27 | `$ ) lexp-seq' )` | `) ( c ) ) $` | `match` (匹配右括号 `)`) |
| 28 | `$ ) lexp-seq'` | `( c ) ) $` | `lexp-seq' → lexp lexp-seq'` |
| 29 | `$ ) lexp-seq' lexp` | `( c ) ) $` | `lexp → list` |
| 30 | `$ ) lexp-seq' list` | `( c ) ) $` | `list → ( lexp-seq )` |
| 31 | `$ ) lexp-seq' ) lexp-seq (` | `( c ) ) $` | `match` (匹配左括号 `(`) |
| 32 | `$ ) lexp-seq' ) lexp-seq` | `c ) ) $` | `lexp-seq → lexp lexp-seq'` |
| 33 | `$ ) lexp-seq' ) lexp-seq' lexp` | `c ) ) $` | `lexp → atom` |
| 34 | `$ ) lexp-seq' ) lexp-seq' atom` | `c ) ) $` | `atom → identifier` |
| 35 | `$ ) lexp-seq' ) lexp-seq' identifier` | `c ) ) $` | `match` (匹配标示符 `c`) |
| 36 | `$ ) lexp-seq' ) lexp-seq'` | `) ) $` | `lexp-seq' → ε` |
| 37 | `$ ) lexp-seq' )` | `) ) $` | `match` (匹配右括号 `)`) |
| 38 | `$ ) lexp-seq'` | `) $` | `lexp-seq' → ε` |
| 39 | `$ )` | `) $` | `match` (匹配右括号 `)`) |
| 40 | `$` | `$` | `accept` |

---

## 避坑指南 与 易错点

> [!WARNING]
> **切勿在 LL(1) 分析表中留有 epsilon 字符列**：
> 分析表的列首只可能是终结符或 `$`，绝对不能出现 $\varepsilon$。非终结符的 $\varepsilon$-production 是通过判断输入 Token 属于该非终结符的 `FOLLOW` 集合来填入对应非空终结符单元格的。
> 
> **追踪动作时牢记“原子化”执行**：
> 在手动书写 LL(1) 追踪步骤时，绝对不要将“栈顶元素扩展”与“匹配匹配输入Token”写在同一行。例如第 2 步 `list → ( lexp-seq )` 和第 3 步 `match (` 必须严密地分为两行，否则会因为“多步动作合并”在期末阅卷中痛失步骤分。
