---
title: Ex4.21_判断文法不是LL1
english: "Example: Showing a Grammar Is Not LL(1)"
type: example
chapter_type: representative
aliases:
  - Ex4.21
  - Exercise 4.21
  - Ex4.21 Not LL(1)
  - 判断文法不是LL1
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
  - parsing-table
  - conflict
  - FIRST
  - FOLLOW
source: textbook
exercise: "4.21"
status: active
related_recipes:
  - "[[03_判断文法不是LL1]]"
related_concepts:
  - "[[LL(1)文法]]"
  - "[[FIRST集合]]"
  - "[[FOLLOW集合]]"
  - "[[LL(1)预测分析表（自顶向下分析的方向指示牌）]]"
common_mistakes:
  - "[[99_Chapter4_自顶向下分析_易错点]]"
created: 2026-06-10
---

# Ex4.21 — 判断文法不是 LL(1)

## Original Question / 原题重现

<img src="../原题图片/Ch4_LL1_Ex4.21_原题.png" alt="原题图片" width="595">

Given the grammar:
$$
A \to a A a \mid \varepsilon
$$

a. Show that this grammar is not LL(1).

### 中文题意
给定文法 $A \to a A a \mid \varepsilon$，证明该文法不是 LL(1)。

---

## Artifacts & Images / 答案与原图归档

### 官方标准答案
<img src="../原题图片/Ch4_LL1_Ex4.21_标准答案_01.png" alt="官方标准答案" width="650">

---

### 学生作答手稿
<img src="../我的答案图片/Ch4_LL1_Ex4.21_我的答案_01.jpg" alt="我的解答" width="600">

---

## Teacher's Warning / 易错警示与评分痛点

> [!WARNING] 老师的典型痛点反馈：表格只是证据，分析才是答案！
> 老师在批改这道题时，明确指出了同学们在解答此类“证明不是 LL(1)”题目时的典型思维漏洞：
> 1. **“表怎么来的，必须有交代”**：很多同学一上来就只画了一张 Parsing Table，而对于表中的非空项和空项由何而来（FIRST / FOLLOW 集合的计算依据）完全没有说明。这种没有前置逻辑依据的证据在编译原理大题中会被扣掉步骤分（说明逻辑思维不足）。
> 2. **“冲突在哪里，必须指出来”**：有的同学虽然画了表，表格里也体现了在同一个格子中存在多个产生式，但并没有对冲突进行分析（没有交待到底在哪个格子、发生了什么冲突，说明分析能力不足）。

---

## Step-by-Step Proof / 规范推导证明步骤

要证明一个文法不是 LL(1) 的，必须以严密的逻辑交代：**集合推导 $\to$ 分析表构造 $\to$ 冲突定位 $\to$ 结论**。

### 第一步：计算文法的 FIRST 集合与 FOLLOW 集合（交代分析表依据）
为了构造分析表并判断冲突，我们必须先严密推导非终结符的集合：

1. **计算 $\text{FIRST}(A)$**：
   * 根据产生式 $A \to a A a$，其右部以终结符 $a$ 开头，因此 $a \in \text{FIRST}(A)$。
   * 根据产生式 $A \to \varepsilon$，因此 $\varepsilon \in \text{FIRST}(A)$。
   * 综上：
     $$
     \text{FIRST}(A) = \{ a, \varepsilon \}
     $$

2. **计算 $\text{FOLLOW}(A)$**：
   * 因为 $A$ 是文法的主开始符号，所以输入结束符 $\text{＄}$ 必须加入 $\text{FOLLOW}(A)$。
   * 在产生式 $A \to a A a$ 的右部中，非终结符 $A$ 的后面跟着终结符 $a$，因此终结符 $a$ 也必须加入 $\text{FOLLOW}(A)$。
   * 综上：
     $$
     \text{FOLLOW}(A) = \{ a, \text{＄} \}
     $$

---

### 第二步：根据填表规则构造 LL(1) 分析表 (Construct LL(1) Parsing Table)
根据 LL(1) 分析表构造算法，我们将产生式填入分析表 $M$ 中：

1. **对于产生式 $A \to a A a$**：
   * 计算右部的 FIRST 集合：$\text{FIRST}(a A a) = \{ a \}$。
   * 因此，将 $A \to a A a$ 填入第 $A$ 行、第 $a$ 列的单元格：
     $$
     M[A, a] \leftarrow A \to a A a
     $$
2. **对于产生式 $A \to \varepsilon$**：
   * 因为该产生式右部为 $\varepsilon$，我们需要将其填入非终结符 $A$ 的 $\text{FOLLOW}$ 集合对应的所有终结符列。
   * 已知 $\text{FOLLOW}(A) = \{ a, \text{＄} \}$，因此我们需要将 $A \to \varepsilon$ 填入以下两个单元格：
     $$
     M[A, a] \leftarrow A \to \varepsilon
     $$
     $$
     M[A, \text{＄}] \leftarrow A \to \varepsilon
     $$

构造出的 LL(1) 分析表如下所示：

| 非终结符 | $a$ | $\text{＄}$ |
| :---: | :--- | :--- |
| **$A$** | $A \to a A a$<br>$A \to \varepsilon$ | $A \to \varepsilon$ |

---

### 第三步：指出具体的冲突点与冲突类型（定位与分析）
观察上述构造出来的分析表 $M$：
* 在单元格 **$M[A, a]$** 中，**同时填入**了两个不同的产生式：
  * $A \to a A a$
  * $A \to \varepsilon$
* **冲突原因分析**：这是由于终结符 $a$ 同时存在于 $\text{FIRST}(a A a)$ 和 $\text{FOLLOW}(A)$ 中，且 $A$ 是一个可空符号（$\varepsilon \in \text{FIRST}(A)$）。这导致了经典的 **FIRST/FOLLOW 冲突**：
  $$
  \text{FIRST}(a A a) \cap \text{FOLLOW}(A) = \{ a \} \cap \{ a, \text{＄} \} = \{ a \} \neq \varnothing
  $$
  这在编译概念上意味着：当分析器栈顶为 $A$且当前输入 Token 为 $a$ 时，它面临多重选择（既可以展开为 $a A a$，也可以归约为 $\varepsilon$），从而无法做出确定性决策。

---

### 第四步：得出结论
根据 LL(1) 文法的定义，一个文法是 LL(1) 的充要条件是**其对应的 LL(1) 分析表中的每个单元格至多只能包含一个产生式**。

由于在分析表 $M$ 中，单元格 $M[A, a]$ 存在多重定义项（冲突），因此该文法 **不是 LL(1) 文法**。证明完毕。

---

## Method Summary / 解题心法与避坑指南

### 1. 证明非 LL(1) 的两层境界
* **基础层（查冲突格）**：能画出分析表，并在格子中写出双产生式（这也是官方答案所呈现的形式）。
* **满分层（论证逻辑）**：通过前置推导交代 $\text{FIRST}/\text{FOLLOW}$，再通过表格指出具体格子（如 $M[A, a]$），并用逻辑公式（如 $\text{FIRST}(aAa) \cap \text{FOLLOW}(A) \neq \varnothing$）一针见血指出冲突类型。这才是符合老师评分标准、体现深度分析能力的解法。

### 2. 从文法结构一眼看穿“非 LL(1)”
像 $A \to a A a \mid \varepsilon$ 这种文法，直观上具有“对称性”（前后都有终结符 $a$）。因为它是递归的，且可以推导为空，那么在内层 $A$ 收尾和外层 $A$ 右侧的 $a$ 之间，势必会产生“什么时候该收缩为空，什么时候该继续展开”的歧义，因此绝对不可能是 LL(1) 的。
