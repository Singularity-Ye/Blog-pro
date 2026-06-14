---
title: Ex3.1_无二义性文法构造
english: "Example: Unambiguous Grammar and Derivation"
type: example
chapter_type: representative
aliases:
  - 无二义性文法构造例题
  - Unambiguous Grammar Construction
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
  - 二义性文法
related_recipes:
  - 01_重写二义性文法套路
status: complete
created: 2026-06-12
---

# Ex3.1 无二义性文法构造

## Original Question

**3.1**
*   **(a)** Write down an unambiguous grammar that generates the set of strings $\{s;, s; s;, s; s; s;, \dots\}$.
*   **(b)** Give a leftmost and rightmost derivation for the string $s;s;$ using your grammar.

---

## 中文题意

**3.1**
*   **(a)** 编写一个无二义性的文法，用于生成以下字符串集合：$\{s;, s; s;, s; s; s;, \dots\}$。
*   **(b)** 使用你所给出的文法，写出字符串 $s;s;$ 的最左推导和最右推导。

---

## Type 题型

无二义性文法构造 / 最左与最右推导 / 上下文无关文法基础

---

## Related Concepts

- [[CFG与上下文无关文法]] / [[二义性文法]]
- [[最左推导]] / [[最右推导]]
- [[01_重写二义性文法套路]]

---

## Artifacts & Images / 答案与原图归档

### 1. 原题与标准答案 (扁平图片 - 纵向排布)

**原题内容 Ex3.1**
<img src="../原题图片/Ex3.1_无二义性文法构造_原题_01.png" alt="原题内容" width="650">

**官方标准答案**
<img src="../原题图片/Ex3.1_无二义性文法构造_标准答案_01.png" alt="官方标准答案" width="650">

---

### 2. 学生作答手稿 (纵向放大排布)

**我的解答手稿**
<img src="../我的答案图片/Ex3.1_无二义性文法构造_我的答案_01.png" alt="我的解答" width="600">

---

## ⚠️ 真实考场还原与作答深度对比

我们将 **学生作答手稿** 与 **官方标准答案** 进行逐一比对和深度学术剖析，发现在本题中学生犯了一个非常典型且容易被忽略的“前后文法不一致”错误：

### 1. 题 a：文法构造的多样性与等价性
*   **学生手稿**：`S -> S s ; | s ;` （**左递归文法**，完全正确 ✅）
*   **官方答案**：`S -> s ; S | s ;` （**右递归文法**，完全正确 ✅）
*   **学术剖析**：
    *   目标语言为 $\{ (s;)^n \mid n \ge 1 \}$，即至少重复一次的字符串 $s;$ 序列。
    *   **左递归形式** `S -> S s ; | s ;` 与 **右递归形式** `S -> s ; S | s ;` 都是无二义性的，且二者生成的语言完全等价。在自底向上（Bottom-up）分析中，左递归更为常用（能节省栈空间）；而在自顶向下（Top-down）分析中，右递归更为常用。

### 2. 题 b：推导过程的前后文法断层（核心扣分点 ⚠️）
*   **学生手稿做法**：
    *   最左推导：$S \Rightarrow S\ s\ ; \Rightarrow s\ ;\ s\ ;$
    *   最右推导：$S \Rightarrow s\ ;\ S \Rightarrow s\ ;\ s\ ;$
*   **学术剖析与阅卷扣分点**：
    *   **手稿逻辑断层**：仔细观察学生在 part (b) 中的两个推导。最左推导使用了产生式 $S \rightarrow S\ s\ ;$；而最右推导中，第一步写的是 $S \Rightarrow s\ ;\ S$，这显然是使用了产生式 $S \rightarrow s\ ;\ S$！
    *   在同一个题目中，**一旦在 part (a) 定义了文法，在 part (b) 的推导中就必须严格使用该文法中的产生式**。学生手稿在最左推导中使用了左递归文法，在最右推导中却突然切换成了右递归文法。在真实考场中，这属于严重的逻辑前后不一致，**最右推导部分会被直接判错扣分**。
    *   **推导的唯一性**：由于文法中每个产生式右部至多包含一个非终结符 $S$，因此不论是左递归文法还是右递归文法，其最左推导和最右推导在每一步替换时都**只有唯一的非终结符可供替换**。这意味着：
        *   若采用左递归文法 `S -> S s ; | s ;`，其最左和最右推导完全相同，均为：
            $$S \Rightarrow S\ s\ ; \Rightarrow s\ ;\ s\ ;$$
        *   若采用右递归文法 `S -> s ; S | s ;`，其最左和最右推导也完全相同，均为：
            $$S \Rightarrow s\ ;\ S \Rightarrow s\ ;\ s\ ;$$
        *   学生试图通过“强行让最左和最右推导写得不一样”来迎合题目问法，反而暴露了对推导概念理解的漏洞。

### 3. 官方答案细节微疵（Typo 警示 🌟）
*   官方标准答案中，最左与最右推导的最后一步写为了：
    $$\dots \Rightarrow s; s$$
    这显然遗漏了最后一个字符的右半部分分号 `;`（应为 $s;s;$）。这是教材课件制作中常见的印刷错误（Typo），学生手稿中的书写结果反而更符合严格的推导定义。

---

## Standard Solution 标准答案

### 选项一：官方规范的右递归文法及推导

*   **无二义性右递归文法**：
    $$S \rightarrow s\ ;\ S \mid s\ ;$$
*   **最左推导 (Leftmost Derivation)**：
    $$S \Rightarrow s\ ;\ S \Rightarrow s\ ;\ s\ ;$$
*   **最右推导 (Rightmost Derivation)**：
    $$S \Rightarrow s\ ;\ S \Rightarrow s\ ;\ s\ ;$$

---

### 选项二：同样正确的左递归文法及推导（考场手算推荐）

*   **无二义性左递归文法**：
    $$S \rightarrow S\ s\ ;\ \mid\ s\ ;$$
*   **最左推导 (Leftmost Derivation)**：
    $$S \Rightarrow S\ s\ ;\ \Rightarrow s\ ;\ s\ ;$$
*   **最右推导 (Rightmost Derivation)**：
    $$S \Rightarrow S\ s\ ;\ \Rightarrow s\ ;\ s\ ;$$

*(注：由于该语言的文法产生式中只包含一个非终结符 $S$，因此在这两种文法下，其最左与最右推导序列在物理上都是完全等价且恒等的)*

---

## 避坑指南 与 易错点

> [!WARNING]
> **文法与推导必须统一**：
> 在解答“给定文法写出最左/最右推导”的题目时，**第一步必须核对推导每一步所使用的产生式是否在前面声明的文法中存在**。千万不要凭直觉凑出推导式，甚至在最左和最右推导中混用左递归和右递归产生式。
> 
> **单非终结符句型的推导恒等性**：
> 如果文法产生式的右部至多只有一个非终结符（如简单重复序列文法、正则文法等），那么其最左推导和最右推导在每一步被替换的都是同一个非终结符，因此**它们的推导公式是完全一样的**。考场上面对这类题目，不要为了强求“不一样”而胡乱编造产生式。
