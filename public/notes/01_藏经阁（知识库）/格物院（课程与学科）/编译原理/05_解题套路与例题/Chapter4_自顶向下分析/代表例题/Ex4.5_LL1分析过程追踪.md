---
title: Ex4.5_LL1分析过程追踪
english: "Example: LL(1) Parser Trace"
type: example
chapter_type: representative
aliases:
  - Ex4.5
  - Exercise 4.5
  - LL(1) Parser Trace
  - LL1分析过程追踪
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
  - parser-trace
  - parsing-stack
  - parsing-table
source: textbook
exercise: "4.5"
status: active
related_recipes:
  - "[[01_LL1分析过程追踪套路]]"
related_concepts:
  - "[[LL(1)文法]]"
  - "[[LL(1)预测分析表（自顶向下分析的方向指示牌）]]"
  - "[[LL(1)分析栈（倒装衣服的窄筒行李箱）]]"
  - "[[FIRST集合]]"
  - "[[FOLLOW集合]]"
common_mistakes:
  - "[[99_Chapter4_自顶向下分析_易错点]]"
created: 2026-06-11
---

# Ex4.5 — LL(1) 分析过程追踪

## Original Question / 原题重现

![原题图片](/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E5%8E%9F%E9%A2%98%E5%9B%BE%E7%89%87/Ch4_LL1%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B%E8%BF%BD%E8%B8%AA_Ex4.5_%E5%8E%9F%E9%A2%98.png)

Show the actions of an LL(1) parser that uses Table 4.4 to recognize the following arithmetic expressions:
a. `3 + 4 * 5 - 6`
b. `3 * (4 - 5 + 6)`
c. `3 - (4 + 5 * 6)`

### 中文题意
使用教材 Table 4.4 中给出的 LL(1) 分析表，展示 LL(1) 分析器识别以下算术表达式时的动作过程（状态栈变化与匹配动作）。

---

## Artifacts & Images / 答案与原图归档

### 1. 我的手写解答草稿

| 第一页 | 第二页 | 第三页 | 第四页 |
| :---: | :---: | :---: | :---: |
| <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ch4_LL1%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B%E8%BF%BD%E8%B8%AA_Ex4.5_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_01.png" alt="我的解答" width="220"> | <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ch4_LL1%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B%E8%BF%BD%E8%B8%AA_Ex4.5_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_02.png" alt="我的解答" width="220"> | <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ch4_LL1%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B%E8%BF%BD%E8%B8%AA_Ex4.5_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_03.png" alt="我的解答" width="220"> | <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ch4_LL1%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B%E8%BF%BD%E8%B8%AA_Ex4.5_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_04.png" alt="我的解答" width="220"> |

### 2. 教材官方标准答案 (以 b 为例)

| 标准答案 (以 b 为例) |
| :---: |
| <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter4_%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B%E5%88%86%E6%9E%90/%E5%8E%9F%E9%A2%98%E5%9B%BE%E7%89%87/Ch4_LL1%E5%88%86%E6%9E%90%E8%BF%87%E7%A8%8B%E8%BF%BD%E8%B8%AA_Ex4.5_%E6%A0%87%E5%87%86%E7%AD%94%E6%A1%88_01.png" alt="标准答案" width="450"> |

---

## 核心要点：LL(1) Parser 的两种建模视角

在分析本题的动作步骤时，存在两种完全合理但抽象粒度不同的建模视角。这往往是导致学生答案与官方标准答案“对不上”的核心原因：

### 视角一：Token 级别分析（官方答案采用）
* **核心思想**：词法分析器（Lexer）已经将具体的数字（如 `3`）和运算符（如 `+`, `*`）归类为了 Token。
* **规则处理** ：在语法分析器（Parser）看来，`number`、`addop`、`mulop` 直接就是 **终结符（Terminals）** 。
* **动作简化** ：当栈顶为 `addop` 且输入为 `+` 时，由于 `+` 属于 `addop` Token 类，直接执行 `match` 动作。整个过程中 **不出现** `addop → +` 或 `mulop → *` 这种极简产生式的推导展开。

### 视角二：纯符号文法展开（学生初学常用）
* **核心思想** ：严格按照文法产生式的定义，将 `addop`、`mulop` 和 `number` 视为 **非终结符（Nonterminals）** 。
* **动作完整** ：在进行 `match` 之前，必须先通过产生式进行一步展开（例如：栈顶 `addop` 遇到输入 `+`，先执行动作 `addop → +` 将其替换为真正的终结符 `+`，下一步才能执行 `match`）。
* **优缺点** ：过程更为详尽，符合纯文法推导逻辑，但在画分析表和追踪时会多出很多冗余步骤。

> [!TIP] 建议
> 在平时做题或考试时，**优先采用“视角一（Token 级别分析）”**，因为这符合编译原理中“词法分析与语法分析解耦”的实际工业实现，且书写简练，不易出错。

---

## 标准答案追踪 (视角一：Token 级别分析)

### a. 输入串 `3 + 4 * 5 - 6$` 的分析步骤
输入串 Token 化为：`number + number * number - number $`

| 步骤 | Parsing Stack | Input | Action |
|:---:| :--- | :--- | :--- |
| 1 | `$ exp` | `3 + 4 * 5 - 6 $` | `exp → term exp'` |
| 2 | `$ exp' term` | `3 + 4 * 5 - 6 $` | `term → factor term'` |
| 3 | `$ exp' term' factor` | `3 + 4 * 5 - 6 $` | `factor → number` |
| 4 | `$ exp' term' number` | `3 + 4 * 5 - 6 $` | `match` (匹配数字 `3`) |
| 5 | `$ exp' term'` | `+ 4 * 5 - 6 $` | `term' → ε` |
| 6 | `$ exp'` | `+ 4 * 5 - 6 $` | `exp' → addop term exp'` |
| 7 | `$ exp' term addop` | `+ 4 * 5 - 6 $` | `match` (匹配加号 `+`) |
| 8 | `$ exp' term` | `4 * 5 - 6 $` | `term → factor term'` |
| 9 | `$ exp' term' factor` | `4 * 5 - 6 $` | `factor → number` |
| 10 | `$ exp' term' number` | `4 * 5 - 6 $` | `match` (匹配数字 `4`) |
| 11 | `$ exp' term'` | `* 5 - 6 $` | `term' → mulop factor term'` |
| 12 | `$ exp' term' factor mulop` | `* 5 - 6 $` | `match` (匹配乘号 `*`) |
| 13 | `$ exp' term' factor` | `5 - 6 $` | `factor → number` |
| 14 | `$ exp' term' number` | `5 - 6 $` | `match` (匹配数字 `5`) |
| 15 | `$ exp' term'` | `- 6 $` | `term' → ε` |
| 16 | `$ exp'` | `- 6 $` | `exp' → addop term exp'` |
| 17 | `$ exp' term addop` | `- 6 $` | `match` (匹配减号 `-`) |
| 18 | `$ exp' term` | `6 $` | `term → factor term'` |
| 19 | `$ exp' term' factor` | `6 $` | `factor → number` |
| 20 | `$ exp' term' number` | `6 $` | `match` (匹配数字 `6`) |
| 21 | `$ exp' term'` | `$` | `term' → ε` |
| 22 | `$ exp'` | `$` | `exp' → ε` |
| 23 | `$` | `$` | `accept` |

---

### b. 输入串 `3 * (4 - 5 + 6)$` 的分析步骤
输入串 Token 化为：`number * ( number - number + number ) $`

| 步骤 | Parsing Stack | Input | Action |
|:---:| :--- | :--- | :--- |
| 1 | `$ exp` | `3 * (4 - 5 + 6) $` | `exp → term exp'` |
| 2 | `$ exp' term` | `3 * (4 - 5 + 6) $` | `term → factor term'` |
| 3 | `$ exp' term' factor` | `3 * (4 - 5 + 6) $` | `factor → number` |
| 4 | `$ exp' term' number` | `3 * (4 - 5 + 6) $` | `match` (匹配数字 `3`) |
| 5 | `$ exp' term'` | `* (4 - 5 + 6) $` | `term' → mulop factor term'` |
| 6 | `$ exp' term' factor mulop` | `* (4 - 5 + 6) $` | `match` (匹配乘号 `*`) |
| 7 | `$ exp' term' factor` | `(4 - 5 + 6) $` | `factor → ( exp )` |
| 8 | `$ exp' term' ) exp (` | `(4 - 5 + 6) $` | `match` (匹配左括号 `( `) |
| 9 | `$ exp' term' ) exp` | `4 - 5 + 6 ) $` | `exp → term exp'` |
| 10 | `$ exp' term' ) exp' term` | `4 - 5 + 6 ) $` | `term → factor term'` |
| 11 | `$ exp' term' ) exp' term' factor` | `4 - 5 + 6 ) $` | `factor → number` |
| 12 | `$ exp' term' ) exp' term' number` | `4 - 5 + 6 ) $` | `match` (匹配数字 `4`) |
| 13 | `$ exp' term' ) exp' term'` | `- 5 + 6 ) $` | `term' → ε` |
| 14 | `$ exp' term' ) exp'` | `- 5 + 6 ) $` | `exp' → addop term exp'` |
| 15 | `$ exp' term' ) exp' term addop` | `- 5 + 6 ) $` | `match` (匹配减号 `-`) |
| 16 | `$ exp' term' ) exp' term` | `5 + 6 ) $` | `term → factor term'` |
| 17 | `$ exp' term' ) exp' term' factor` | `5 + 6 ) $` | `factor → number` |
| 18 | `$ exp' term' ) exp' term' number` | `5 + 6 ) $` | `match` (匹配数字 `5`) |
| 19 | `$ exp' term' ) exp' term'` | `+ 6 ) $` | `term' → ε` |
| 20 | `$ exp' term' ) exp'` | `+ 6 ) $` | `exp' → addop term exp'` |
| 21 | `$ exp' term' ) exp' term addop` | `+ 6 ) $` | `match` (匹配加号 `+`) |
| 22 | `$ exp' term' ) exp' term` | `6 ) $` | `term → factor term'` |
| 23 | `$ exp' term' ) exp' term' factor` | `6 ) $` | `factor → number` |
| 24 | `$ exp' term' ) exp' term' number` | `6 ) $` | `match` (匹配数字 `6`) |
| 25 | `$ exp' term' ) exp' term'` | `) $` | `term' → ε` |
| 26 | `$ exp' term' ) exp'` | `) $` | `exp' → ε` |
| 27 | `$ exp' term' )` | `) $` | `match` (匹配右括号 `)`) |
| 28 | `$ exp' term'` | `$` | `term' → ε` |
| 29 | `$ exp'` | `$` | `exp' → ε` |
| 30 | `$` | `$` | `accept` |

---

### c. 输入串 `3 - (4 + 5 * 6)$` 的分析步骤
输入串 Token 化为：`number - ( number + number * number ) $`

| 步骤 | Parsing Stack | Input | Action |
|:---:| :--- | :--- | :--- |
| 1 | `$ exp` | `3 - (4 + 5 * 6) $` | `exp → term exp'` |
| 2 | `$ exp' term` | `3 - (4 + 5 * 6) $` | `term → factor term'` |
| 3 | `$ exp' term' factor` | `3 - (4 + 5 * 6) $` | `factor → number` |
| 4 | `$ exp' term' number` | `3 - (4 + 5 * 6) $` | `match` (匹配数字 `3`) |
| 5 | `$ exp' term'` | `- (4 + 5 * 6) $` | `term' → ε` |
| 6 | `$ exp'` | `- (4 + 5 * 6) $` | `exp' → addop term exp'` |
| 7 | `$ exp' term addop` | `- (4 + 5 * 6) $` | `match` (匹配减号 `-`) |
| 8 | `$ exp' term` | `(4 + 5 * 6) $` | `term → factor term'` |
| 9 | `$ exp' term' factor` | `(4 + 5 * 6) $` | `factor → ( exp )` |
| 10 | `$ exp' term' ) exp (` | `(4 + 5 * 6) $` | `match` (匹配左括号 `( `) |
| 11 | `$ exp' term' ) exp` | `4 + 5 * 6 ) $` | `exp → term exp'` |
| 12 | `$ exp' term' ) exp' term` | `4 + 5 * 6 ) $` | `term → factor term'` |
| 13 | `$ exp' term' ) exp' term' factor` | `4 + 5 * 6 ) $` | `factor → number` |
| 14 | `$ exp' term' ) exp' term' number` | `4 + 5 * 6 ) $` | `match` (匹配数字 `4`) |
| 15 | `$ exp' term' ) exp' term'` | `+ 5 * 6 ) $` | `term' → ε` |
| 16 | `$ exp' term' ) exp'` | `+ 5 * 6 ) $` | `exp' → addop term exp'` |
| 17 | `$ exp' term' ) exp' term addop` | `+ 5 * 6 ) $` | `match` (匹配加号 `+`) |
| 18 | `$ exp' term' ) exp' term` | `5 * 6 ) $` | `term → factor term'` |
| 19 | `$ exp' term' ) exp' term' factor` | `5 * 6 ) $` | `factor → number` |
| 20 | `$ exp' term' ) exp' term' number` | `5 * 6 ) $` | `match` (匹配数字 `5`) |
| 21 | `$ exp' term' ) exp' term'` | `* 6 ) $` | `term' → mulop factor term'` |
| 22 | `$ exp' term' ) exp' term' factor mulop` | `* 6 ) $` | `match` (匹配乘号 `*`) |
| 23 | `$ exp' term' ) exp' term' factor` | `6 ) $` | `factor → number` |
| 24 | `$ exp' term' ) exp' term' number` | `6 ) $` | `match` (匹配数字 `6`) |
| 25 | `$ exp' term' ) exp' term'` | `) $` | `term' → ε` |
| 26 | `$ exp' term' ) exp'` | `) $` | `exp' → ε` |
| 27 | `$ exp' term' )` | `) $` | `match` (匹配右括号 `)`) |
| 28 | `$ exp' term'` | `$` | `term' → ε` |
| 29 | `$ exp'` | `$` | `exp' -> ε` |
| 30 | `$` | `$` | `accept` |

---

## 跨章节超链接：Value Stack (值栈/属性栈) 评估机制深剖

在手写解答中，你引入了 `Value stack` (值栈) 这一列。这是一个非常高级且有前瞻性的尝试！
在编译器设计中，这属于 **Chapter 6 属性文法与语义分析** 中，利用语法制导翻译（SDT）在语法分析过程中同步进行求值的操作。

### 1. LL 分析中的属性传递模型 (L-属性文法)
由于自顶向下分析（LL）是**自左向右**进行的，为了在分析的同时求值，我们必须使用**值栈（Value Stack）** 来存储和传播属性。此时：
* **继承属性（Inherited Attributes）**（例如算术项的累加中间结果 `subtotal`）：在产生式展开时**自顶向下传递**。
* **综合属性（Synthesized Attributes）**（例如因子或表达式的最终求得值 `val`）：在产生式归约/完成时**自底向上回传**。

### 2. 表达式求值的属性依赖逻辑
我们可以将文法加上语义动作（SDD/SDT）写出：
$$
\begin{aligned}
exp &\to term\ exp' && \{ exp.val = exp'.val;\ exp'.subtotal = term.val \} \\
exp' &\to addop\ term\ exp_1' && \{ exp'.val = exp_1'.val;\ exp_1'.subtotal = exp'.subtotal \oplus term.val \} \\
exp' &\to \varepsilon && \{ exp'.val = exp'.subtotal \} \\
term &\to factor\ term' && \{ term.val = term'.val;\ term'.subtotal = factor.val \} \\
term' &\to mulop\ factor\ term_1' && \{ term'.val = term_1'.val;\ term_1'.subtotal = term'.subtotal \otimes factor.val \} \\
term' &\to \varepsilon && \{ term'.val = term'.subtotal \} \\
factor &\to (\ exp\ ) && \{ factor.val = exp.val \} \\
factor &\to number && \{ factor.val = number.val \}
\end{aligned}
$$
其中，$\oplus$ 代表加减法操作，$\otimes$ 代表乘法操作。

### 3. 以 `3 + 4 * 5 - 6` 的值栈变化为例
在手写解答第 1 页中，值栈呈现出类似 `3 $` $\to$ `4 3 $` $\to$ `5 4 3 $` $\to$ `20 3 $` $\to$ `23 $` $\to$ `17 $` 的变化：

* **数字入栈**：当匹配到 `number` 并执行 `match` 时，其具体数值被推进值栈。
  * 匹配 `3` $\to$ 值栈为 `[3]`
  * 匹配 `4` $\to$ 值栈变为 `[4, 3]` （栈顶为 4）
  * 匹配 `5` $\to$ 值栈变为 `[5, 4, 3]` （栈顶为 5）
* **运算归约**：当一个包含运算符的产生式匹配结束（即遇到 $\varepsilon$ 产生式代表该子树构造完毕）时，弹出值栈栈顶的两个元素进行计算，并将结果压回值栈：
  * 当乘法算术项 `term' -> ε` 发生时，弹出 `5` 和 `4`，由于它们由 `mulop (*)` 关联，计算 $4 \times 5 = 20$，将结果 `20` 压回。值栈变为 `[20, 3]`。
  * 接着，加法算术项 `exp' -> ε` 在解析完 `-` 之前的部分时，将 `20` 和 `3` 弹出并相加，得到 `23` 压回。值栈变为 `[23]`。
  * 匹配 `6` $\to$ 值栈变为 `[6, 23]`。
  * 最后整个表达式解析结束，执行减法：弹出 `6` 和 `23` 计算 $23 - 6 = 17$，最终结果 `17` 留在栈顶。

> [!NOTE] 总结
> 你的手写值栈求值思路是完全正确的！它通过显式维护一个属性值栈，完美地模拟了自顶向下 LL 分析器在进行语义计算（即表达式求值）时的行为。在单纯的语法分析题（如 Ex4.5）中，官方通常只要求写出 `Parsing Stack`、`Input` 和 `Action`；但在语义分析综合题中，值栈的推导就是必拿分的绝对核心。
