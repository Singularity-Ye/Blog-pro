---
title: Ex3.20_正规式与文法等价转换
english: "Example: Equivalence of Regular Expressions and Grammars"
type: example
chapter_type: representative
aliases:
  - 正规式与文法等价转换
  - Ex3.20
source_chapter:
  - 3
used_in_chapter:
  - 3
tags:
  - 编译原理
  - 正规式
  - 上下文无关文法
  - 有限自动机
  - 等价转换
related_concepts:
  - CFG与上下文无关文法
  - 正规式
  - 有穷自动机
related_recipes:
  - 01_正规式转NFA与DFA套路
status: complete
created: 2026-06-12
---

# Ex3.20 正规式与文法等价转换

## Original Question

**3.20**
*   **(a)** Write a regular expression that generates the same language as the following grammar:
    $$
    A \rightarrow aA \mid B \mid \varepsilon
    $$
    $$
    B \rightarrow bB \mid A
    $$
*   **(b)** Write a grammar that generates the same language as the following regular expression:
    $$
    (a \mid c \mid ba \mid bc)^* (b \mid \varepsilon)
    $$

---

## 中文题意

**3.20**
*   **(a)** 写出一个正规式，它与下列文法生成相同的语言：
    $$
    A \rightarrow aA \mid B \mid \varepsilon
    $$
    $$
    B \rightarrow bB \mid A
    $$
*   **(b)** 写出一个文法，它与下列正规式生成相同的语言：
    $$
    (a \mid c \mid ba \mid bc)^* (b \mid \varepsilon)
    $$

---

## Type 题型

正规式与正则文法等价转换 / NFA 机械构造文法 / 错题诊断

---

## Related Concepts

- 正规式 与 [[CFG与上下文无关文法]]
- [[NFA]] / [[DFA]] (有穷自动机)
- [[01_正规式转NFA与DFA套路]]

---

## Artifacts & Images / 答案与原图归档

### 1. 原题与标准答案 (扁平图片 - 纵向排布)

**原题内容 Ex3.20**
<img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter3_CFG%E4%B8%8E%E8%AF%AD%E6%B3%95%E5%88%86%E6%9E%90%E5%9F%BA%E7%A1%80/%E5%8E%9F%E9%A2%98%E5%9B%BE%E7%89%87/Ex3.20_%E6%AD%A3%E8%A7%84%E5%BC%8F%E4%B8%8E%E6%96%87%E6%B3%95%E7%AD%89%E4%BB%B7%E8%BD%AC%E6%8D%A2_%E5%8E%9F%E9%A2%98_01.png" alt="原题内容" width="650">

**官方标准答案**
<img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter3_CFG%E4%B8%8E%E8%AF%AD%E6%B3%95%E5%88%86%E6%9E%90%E5%9F%BA%E7%A1%80/%E5%8E%9F%E9%A2%98%E5%9B%BE%E7%89%87/Ex3.20_%E6%AD%A3%E8%A7%84%E5%BC%8F%E4%B8%8E%E6%96%87%E6%B3%95%E7%AD%89%E4%BB%B7%E8%BD%AC%E6%8D%A2_%E6%A0%87%E5%87%86%E7%AD%94%E6%A1%88_01.png" alt="官方标准答案" width="650">

---

### 2. 学生作答手稿与分析图 (纵向放大排布)

**学生手写解答**
<img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter3_CFG%E4%B8%8E%E8%AF%AD%E6%B3%95%E5%88%86%E6%9E%90%E5%9F%BA%E7%A1%80/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ex3.20_%E6%AD%A3%E8%A7%84%E5%BC%8F%E4%B8%8E%E6%96%87%E6%B3%95%E7%AD%89%E4%BB%B7%E8%BD%AC%E6%8D%A2_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_01.png" alt="学生手写解答" width="600">

**关联手绘 NFA 转换图与教师批语 (放大展示)**
<img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter3_CFG%E4%B8%8E%E8%AF%AD%E6%B3%95%E5%88%86%E6%9E%90%E5%9F%BA%E7%A1%80/%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88%E5%9B%BE%E7%89%87/Ex3.20_%E6%AD%A3%E8%A7%84%E5%BC%8F%E4%B8%8E%E6%96%87%E6%B3%95%E7%AD%89%E4%BB%B7%E8%BD%AC%E6%8D%A2_%E6%88%91%E7%9A%84%E7%AD%94%E6%A1%88_02.png" alt="手绘 NFA 转换图" width="600">

---

### 3. 教材理论依据 (横向对比排布 - LR Table)

| 理论依据：NFA 机械构造文法 | 理论依据：转换规则表 (表 3.1) |
| :---: | :---: |
| <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter3_CFG%E4%B8%8E%E8%AF%AD%E6%B3%95%E5%88%86%E6%9E%90%E5%9F%BA%E7%A1%80/%E5%8E%9F%E9%A2%98%E5%9B%BE%E7%89%87/Ex3.20_%E6%AD%A3%E8%A7%84%E5%BC%8F%E4%B8%8E%E6%96%87%E6%B3%95%E7%AD%89%E4%BB%B7%E8%BD%AC%E6%8D%A2_%E6%96%B9%E6%B3%95%E8%AF%B4%E6%98%8E_01.png" alt="NFA机械构造" width="450"> | <img src="/notes/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E7%BC%96%E8%AF%91%E5%8E%9F%E7%90%86/05_%E8%A7%A3%E9%A2%98%E5%A5%97%E8%B7%AF%E4%B8%8E%E4%BE%8B%E9%A2%98/Chapter3_CFG%E4%B8%8E%E8%AF%AD%E6%B3%95%E5%88%86%E6%9E%90%E5%9F%BA%E7%A1%80/%E5%8E%9F%E9%A2%98%E5%9B%BE%E7%89%87/Ex3.20_%E6%AD%A3%E8%A7%84%E5%BC%8F%E4%B8%8E%E6%96%87%E6%B3%95%E7%AD%89%E4%BB%B7%E8%BD%AC%E6%8D%A2_%E6%96%B9%E6%B3%95%E8%AF%B4%E6%98%8E_02.png" alt="转换规则表" width="450"> |

---

## ⚠️ 真实考场还原与作答深度对比

我们将 **学生作答手稿** 与 **官方标准答案** 进行深度学术剖析，并针对 **教师批语** 进行专项纠错与原理解释。

### 1. 题 (a)：文法求正规式的相互递归消解
*   **学生解答**：
    $$
    \begin{aligned}
    A &\rightarrow aA \mid B \mid \varepsilon \\
    &\Rightarrow A \rightarrow aA \mid bB \mid \varepsilon \quad (\text{代入 } B \rightarrow bB \mid A \text{ 中的一部分}) \\
    &\Rightarrow A \rightarrow aA \mid bA \mid \varepsilon \quad (\text{消除 } B \text{ 的递归}) \\
    &\Rightarrow A = (a + b)A + \varepsilon \\
    &\Rightarrow (a \mid b)^*
    \end{aligned}
    $$
    学生得出的正规式为 `(a|b)*`（或 `(a+b)*`），与官方答案 `(a|b)*` 一致，解答正确 ✅。
*   **学术剖析**：
    *   该文法中 $A$ 和 $B$ 互相递归引用： $A$ 可以直接推导出 $B$ ，而 $B$ 又可以推导出 $A$ 。
    *   从直观上看：
        *   从 $A$ 开始，可以消费 $a$ 并留在 $A$ ；或者通过 $A \rightarrow B$ 转移到 $B$ 。
        *   在 $B$ 中，可以消费 $b$ 并留在 $B$ ；或者通过 $B \rightarrow A$ 转移回 $A$ 。
        *   由于两者之间的转移不消费任何终结符（相当于 $\varepsilon$-转移），这意味着我们可以在 $a$ 和 $b$ 之间任意切换并消费任意数量的 $a$ 和 $b$ 。
        *   最后通过 $A \rightarrow \varepsilon$ 结束。因此，它生成的正是所有由 $a$ 和 $b$ 组成的任意字符串，即 $(a \mid b)^*$ 。

---

### 2. 题 (b)：文法未联系导致的“独立自动机”错误（核心纠错 ⚠️）

#### ❌ 学生错误手稿分析
学生给出的文法为：
$$
A \rightarrow Aa \mid Ac \mid Aba \mid Abc \mid \varepsilon
$$
$$
B \rightarrow Ab \mid A
$$
*   **教师批语**：`b)，这个文法A和B没有联系起来，如果画图，就是2个独立的自动机，这明显不对。`
*   **致命错误成因剖析**：
    1.  **起始符号与不可达性**：在文法中，通常默认第一个非终结符为文法的开始符号（这里是 $A$ ）。在非终结符 $A$ 的所有产生式中，右部**完全没有出现**非终结符 $B$ 。
    2.  **推导链断裂**：这意味着，如果我们从开始符号 $A$ 出发进行推导，**无论如何也无法到达或使用非终结符 $B$ 的产生式**。非终结符 $B$ 在整个文法中是**不可达的（Unreachable）**，属于无用符号（Useless Symbol）。
    3.  **语言不完整**：因为 $B$ 无法到达，所以该文法实际生成的语言仅由 $A$ 决定，即 $(a \mid c \mid ba \mid bc)^*$ 。而正规式中结尾的可选字符 $b$ （即表达式中的 $(b \mid \varepsilon)$ 部分）完全被丢失了。
    4.  **自动机分裂（独立自动机）**：如果我们按照产生式将文法画成状态转换图（自动机）：
        *   非终结符 $A$ 对应一个自动机组件，接受 $(a \mid c \mid ba \mid bc)^*$ 。
        *   非终结符 $B$ 对应另一个组件，它有一条 $\varepsilon$ 边和一条 $b$ 边指向 $A$ 。
        *   但由于 $A$ 的状态中**没有任何边**指向 $B$ ，因此以 $A$ 为起点的自动机与以 $B$ 为起点的自动机在结构上是**完全断开、互不相通的两个独立连通分量**。在以 $A$ 为开始状态的自动机中， $B$ 成了无法被激活的“孤岛”，这在结构上显然是错误的。

> [!NOTE]
> **如果学生将 $B$ 作为开始符号会怎样？**
> 如果显式指定 $B$ 为开始符号，那么从 $B$ 出发可以推导出 $Ab$ （以 $b$ 结尾）或 $A$ （不以 $b$ 结尾），而 $A$ 进一步推导前面的重复部分。虽然这样能生成正确的语言，但在正则文法的标准书写习惯和考场标准中，通常要求构造**右线性文法**，且应通过自动机机械方法构造，以避免二义性或不规范的左线性推导。

---

## Standard Solution 标准答案与机械构造过程

对于正规式构造等价文法，最稳妥、绝不出错的方法是**通过 NFA 机械构造右线性正则文法**。

### 第一步：构造正规式对应的 NFA

目标正规式： $(a \mid c \mid ba \mid bc)^* (b \mid \varepsilon)$
我们可以将其简化为： $( (a \mid c) \mid b(a \mid c) )^* (b \mid \varepsilon)$

我们设计一个包含三个状态的有穷自动机（如图五学生手稿所示）：
*   **状态 $A$** ：开始状态，同时也是接收状态（因为 $\varepsilon$ 在语言中）。
    *   当读入 $a$ 或 $c$ 时，留在状态 $A$ （对应 $(a \mid c)$）。
    *   当读入 $b$ 时，可以转移到状态 $B$ （表示已经读入了 $b$，期待接下来的 $a$ 或 $c$ 来完成一次循环）。
    *   当读入 $b$ 时，也可以转移到状态 $C$ （表示读入了结尾的可选字符 $b$，进入停机接收状态）。
*   **状态 $B$** ：中间状态。
    *   当读入 $a$ 或 $c$ 时，转移回状态 $A$ （完成一次 $ba$ 或 $bc$ 的循环）。
*   **状态 $C$** ：结尾接收状态，无出边。

### 第二步：根据 NFA 状态转移方程机械构造文法

根据教材的机械构造规则（图四）：
1.  **状态映射**：为 NFA 的每个状态 $A, B, C$ 建立同名的非终结符 $A, B, C$ 。以开始状态 $A$ 作为文法的开始符号。
2.  **转移映射**（若 $i \xrightarrow{x} j$，则添加 $i \rightarrow x j$）：
    *   $A \xrightarrow{a} A \Rightarrow A \rightarrow aA$
    *   $A \xrightarrow{c} A \Rightarrow A \rightarrow cA$
    *   $A \xrightarrow{b} B \Rightarrow A \rightarrow bB$
    *   $A \xrightarrow{b} C \Rightarrow A \rightarrow bC$
    *   $B \xrightarrow{a} A \Rightarrow B \rightarrow aA$
    *   $B \xrightarrow{c} A \Rightarrow B \rightarrow cA$
3.  **接收状态映射**（若 $i$ 为接收状态，则添加 $i \rightarrow \varepsilon$）：
    *   状态 $A$ 为接收状态 $\Rightarrow A \rightarrow \varepsilon$
    *   状态 $C$ 为接收状态 $\Rightarrow C \rightarrow \varepsilon$

### 第三步：合并产生式并化简

将上述映射结果汇总，得到文法：
$$
\begin{aligned}
A &\rightarrow aA \mid cA \mid bB \mid bC \mid \varepsilon \\
B &\rightarrow aA \mid cA \\
C &\rightarrow \varepsilon
\end{aligned}
$$

由于 $C$ 只能推导出 $\varepsilon$ ，我们可以直接将 $A \rightarrow bC$ 中的 $C$ 代换为 $\varepsilon$ ，即简化为 $A \rightarrow b$ 。
消去单产生式非终结符 $C$ 后，得到最终的规范右线性文法：

$$
A \rightarrow aA \mid cA \mid bB \mid b \mid \varepsilon
$$
$$
B \rightarrow aA \mid cA
$$

此文法成功将 $A$ 和 $B$ 紧密联系在一起，且完全等价于目标正规式。

---

## 避坑指南 与 易错点

> [!WARNING]
> **文法可达性检查**：
> 在考场上写出多变量文法后，必须进行**可达性自检**：从文法的开始符号出发，是否能通过推导链到达你定义的每一个非终结符？如果存在某个非终结符（如本错题中的 $B$ ）在所有产生式的右部都未出现过，则它必定是不可达的，说明你的文法结构存在严重断层！
> 
> **机械化构造的威力**：
> 面对复杂的正规式转文法，千万不要凭空拼凑（容易遗漏边界情况或导致文法断裂）。**先画出直观的有穷自动机（DFA/NFA），再使用机械化规则一对一翻译为文法**。这是编译原理考试中保证满分的最核心套路。
