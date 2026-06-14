---
title: Ex3.6_LISP表达式推导
english: "Example: Leftmost and Rightmost Derivations for LISP-like Expressions"
type: example
chapter_type: representative
aliases:
  - LISP表达式推导例题
  - Derivation of LISP Expressions
source_chapter:
  - 3
used_in_chapter:
  - 3
tags:
  - 编译原理
  - 上下文无关文法
  - 文法推导
  - 最左推导
  - 最右推导
related_concepts:
  - CFG与上下文无关文法
  - 最左推导
  - 最右推导
related_recipes:
  - 01_重写二义性文法套路
status: complete
created: 2026-06-12
---

# Ex3.6 LISP表达式推导

## Original Question

**3.6** Consider the following grammar representing simplified LISP-like expressions:
$$\begin{aligned}
lexp &\rightarrow atom \mid list \\
atom &\rightarrow \textbf{number} \mid \textbf{identifier} \\
list &\rightarrow (lexp\text{--}seq) \\
lexp\text{--}seq &\rightarrow lexp\text{--}seq\ \ lexp \mid lexp
\end{aligned}$$
*   **(a)** Write a leftmost and a rightmost derivation for the string $(a\ 23\ (\ m\ x\ y\ ))$.

---

## 中文题意

**3.6** 考虑以下表示简化 LISP 风格表达式的文法：
$$\begin{aligned}
lexp &\rightarrow atom \mid list \\
atom &\rightarrow \textbf{number} \mid \textbf{identifier} \\
list &\rightarrow (lexp\text{--}seq) \\
lexp\text{--}seq &\rightarrow lexp\text{--}seq\ \ lexp \mid lexp
\end{aligned}$$
*   **(a)** 写出字符串 $(a\ 23\ (\ m\ x\ y\ ))$ 的最左推导和最右推导。

---

## Type 题型

多级非终结符推导 / 递归列表文法分析 / 最左与最右推导实战

---

## Related Concepts

- [[CFG与上下文无关文法]]
- [[最左推导]] / [[最右推导]]
- [[01_重写二义性文法套路]]

---

## Artifacts & Images / 答案与原图归档

### 1. 原题与标准答案 (扁平图片 - 纵向排布)

**原题内容 Ex3.6**
<img src="../原题图片/Ex3.6_LISP表达式推导_原题_01.png" alt="原题内容" width="650">

**官方标准答案 - 第一页**
<img src="../原题图片/Ex3.6_LISP表达式推导_标准答案_01.png" alt="标准答案第1页" width="650">

**官方标准答案 - 第二页 (推导中间过程)**
<img src="../原题图片/Ex3.6_LISP表达式推导_标准答案_02.png" alt="标准答案第2页" width="650">

**官方标准答案 - 第三页 (推导后续与最右推导)**
<img src="../原题图片/Ex3.6_LISP表达式推导_标准答案_03.png" alt="标准答案第3页" width="650">

---

### 2. 学生作答手稿 (纵向放大排布)

**我的解答手稿 (推导部分)**
<img src="../我的答案图片/Ex3.6_LISP表达式推导_我的答案_01.png" alt="我的解答推导" width="600">

**我的解答手稿 (语法分析树部分)**
<img src="../我的答案图片/Ex3.6_LISP表达式推导_我的答案_02.png" alt="我的解答分析树" width="600">

---

## ⚠️ 真实考场还原与作答深度对比

我们将 **学生作答手稿** 与 **官方标准答案** 进行逐一比对和深度学术剖析，发现在本题中官方答案和手稿各有细节长短，且官方答案存在一处非常典型的拼写漏洞：

### 1. 终结符展开的时机与规范性
*   **学生手稿做法**：在推导过程中，只要产生式推导出了终结符标记（如 `identifier`），学生会**立刻将其具体化为目标字符串中的对应终结符**（例如：将 `identifier` 替换为 `a`，将 `number` 替换为 `23`）。
*   **官方答案做法**：官方答案在推导的中间步骤中，**始终保留 Token 占位符**（如 `identifier`、`number`），直到推导的最后一步，才将所有的占位符一次性全部替换为具体的终结符 `a`、`23`、`m`、`x`、`y`。
*   **学术剖析**：
    *   两者的推导从数学定义上都是**完全正确**的。
    *   在编译原理学术规范中，通常更推荐**官方的做法**，即在语法分析阶段，推导的终点是 Token 符号流（如 `identifier`），而不是具体的字面量值。保留占位符进行推导能更清晰地展示文法本身的结构特征。
    *   然而，在考场实际作答中，学生手稿那种“随推导随替换”的方法直观性极强，且不易在后续步骤中因为符号过多而搞错位置，是**极佳的防粗心应试技巧**。

### 2. 官方答案细节硬伤：Token 拼写错误（Typo 🌟）
*   仔细观察官方课件标准答案的最后三行：
    *   标准最左推导最后一步：
        $$\dots \Rightarrow (\textbf{identifier}\ \ \textbf{number}\ \ (\textbf{identify}\ \ \textbf{identify}\ \ \textbf{identify}))$$
    *   标准最右推导最后一步：
        $$\dots \Rightarrow (\textbf{identify}\ \ \textbf{number}\ \ (\textbf{identify}\ \ \textbf{identify}\ \ \textbf{identify}))$$
    *   **病因剖析**：官方答案中，将文法中明确定义的终结符 **`identifier`**（标识符）在倒数几步中错误地拼写为了 **`identify`**（动词，识别）。这是课件制作过程中非常粗心的拼写错误。考场作答时，务必严格使用文法给出的终结符词条（即手稿中的 `identifier`），否则会被扣除符号不一致分。

---

## Standard Solution 标准答案

### 1. 最左推导 (Leftmost Derivation)

最左推导每次替换句型中最左边的非终结符，详细步骤如下：

$$\begin{aligned}
lexp &\Rightarrow list \\
&\Rightarrow (lexp\text{--}seq) \\
&\Rightarrow (lexp\text{--}seq\ \ lexp) \\
&\Rightarrow (lexp\text{--}seq\ \ lexp\ \ lexp) \\
&\Rightarrow (lexp\ \ lexp\ \ lexp) \\
&\Rightarrow (atom\ \ lexp\ \ lexp) \\
&\Rightarrow (\textbf{identifier}\ \ lexp\ \ lexp) \\
&\Rightarrow (a\ \ lexp\ \ lexp) \\
&\Rightarrow (a\ \ atom\ \ lexp) \\
&\Rightarrow (a\ \ \textbf{number}\ \ lexp) \\
&\Rightarrow (a\ \ 23\ \ lexp) \\
&\Rightarrow (a\ \ 23\ \ list) \\
&\Rightarrow (a\ \ 23\ \ (lexp\text{--}seq)) \\
&\Rightarrow (a\ \ 23\ \ (lexp\text{--}seq\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (lexp\text{--}seq\ \ lexp\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (lexp\ \ lexp\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (atom\ \ lexp\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (\textbf{identifier}\ \ lexp\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (m\ \ lexp\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (m\ \ atom\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (m\ \ \textbf{identifier}\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (m\ \ x\ \ lexp)) \\
&\Rightarrow (a\ \ 23\ \ (m\ \ x\ \ atom)) \\
&\Rightarrow (a\ \ 23\ \ (m\ \ x\ \ \textbf{identifier})) \\
&\Rightarrow (a\ \ 23\ \ (m\ \ x\ \ y))
\end{aligned}$$

---

### 2. 最右推导 (Rightmost Derivation)

最右推导每次替换句型中最右边的非终结符，详细步骤如下：

$$\begin{aligned}
lexp &\Rightarrow list \\
&\Rightarrow (lexp\text{--}seq) \\
&\Rightarrow (lexp\text{--}seq\ \ lexp) \\
&\Rightarrow (lexp\text{--}seq\ \ list) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq)) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq\ \ lexp)) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq\ \ lexp\ \ lexp)) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq\ \ lexp\ \ atom)) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq\ \ lexp\ \ \textbf{identifier})) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq\ \ lexp\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq\ \ atom\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq\ \ \textbf{identifier}\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\text{--}seq\ \ x\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ (lexp\ \ x\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ (atom\ \ x\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ (\textbf{identifier}\ \ x\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ (m\ \ x\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ lexp\ \ (m\ \ x\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ atom\ \ (m\ \ x\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ \textbf{number}\ \ (m\ \ x\ \ y)) \\
&\Rightarrow (lexp\text{--}seq\ \ 23\ \ (m\ \ x\ \ y)) \\
&\Rightarrow (lexp\ \ 23\ \ (m\ \ x\ \ y)) \\
&\Rightarrow (atom\ \ 23\ \ (m\ \ x\ \ y)) \\
&\Rightarrow (\textbf{identifier}\ \ 23\ \ (m\ \ x\ \ y)) \\
&\Rightarrow (a\ \ 23\ \ (m\ \ x\ \ y))
\end{aligned}$$

---

## 避坑指南 与 易错点

> [!WARNING]
> **小心递归列表的计数问题**：
> 文法中 `lexp-seq -> lexp-seq lexp | lexp` 是一个左递归列表定义。在展开诸如 `(a 23 (m x y))` 时，最外层包含 3 个元素（`a`、`23`、`(m x y)`），因此必须通过 `lexp-seq` 的产生式展开成恰好 **3 个 `lexp` 项** 的平铺形式，不能多也不能少。
> 
> **最左推导的规范性**：
> 必须始终从左向右寻找第一个非终结符进行替换，在前面的非终结符没有被完全化为终结符之前，**绝对不能**去替换后面的非终结符。
> 
> **最右推导的规范性**：
> 必须始终从右向左寻找第一个非终结符进行替换。
> 
> **考场防错技巧**：
> 考场上容易因眼花而导致中间几步变成“半左半右”推导，建议每步书写前都用手指确认一下当前最边缘的非终结符位置。
