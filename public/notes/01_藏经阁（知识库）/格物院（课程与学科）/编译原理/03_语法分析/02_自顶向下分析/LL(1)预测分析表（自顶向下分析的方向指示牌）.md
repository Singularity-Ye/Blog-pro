---
title: LL(1)预测分析表（自顶向下分析的方向指示牌）
english: Parsing Table
type: table
aliases:
  - LL(1)预测分析表（自顶向下分析的方向指示牌）
  - Parsing Table
  - LL(1)分析表
  - LL(1) Parsing Table
  - predictive parsing table
  - 分析表
tags: [编译原理, 语法分析, 自顶向下]
created: 2026-06-10
source_chapter:
  - 4
used_in_chapter:
  - 4
---

# LL(1)预测分析表（自顶向下分析的方向指示牌）

> [!NOTE] 双轨直觉：看图寻宝的路口对照表
> 二维数组 $M[A, a]$，其中 **行 $A$ 代表你站的路口** （当前栈顶的非终结符），  **列 $a$ 代表眼前的路标**  （当前输入流的 Lookahead Token）。
> 格子里的产生式就是 **你在这个路口看到这个路标时，下一步该怎么走** （使用哪条规则进行展开）。
> 如果你在某个路口看到某个路标，发现表里的格子里写了两个方向，说明导航“打架”了（即发生冲突，说明文法不是 LL(1)）。
> 如果某个格子空空如也，说明你走错路了（语法错误）。

---

## 1. 分析表的结构规则

$$M[A, a] = \text{产生式}$$

* **行首（Rows）**：非终结符（$V_N$），代表当前的语法状态。
* **列首（Columns）**：终结符（$V_T$）以及输入流结束符 `$`。
  
> [!CAUTION] 考前避坑：列首绝对不能有 ε！
> 这是极易扣分的概念性笔误。
> $\varepsilon$ 代表空串，是推导过程中的虚拟占位符， **不是输入符号** 。词法分析器给出的输入流中绝对不会包含 $\varepsilon$。因此，分析表 **绝对不能开设 $\varepsilon$ 列** ！

---

## 2. 机械化填表算法 (Table Construction Algorithm)

对于文法中的每一个产生式 $A \to \alpha$：

1. **第一步（处理常规首符）**：
   对于所有的终结符 $a \in \text{FIRST}(\alpha)$（排除 $\varepsilon$）：
   $$M[A, a] \leftarrow A \to \alpha$$
2. **第二步（处理可空符号）**：
   如果 $\varepsilon \in \text{FIRST}(\alpha)$（即整个右部串 $\alpha$ 是 Nullable 的）：
   对于所有的终结符 $b \in \text{FOLLOW}(A)$（包含 $\$$）：
   $$M[A, b] \leftarrow A \to \alpha$$

---

## 3. 规范填表小示例

### 示例文法 $G'$：
$$
\begin{aligned}
E  &\to T E' \\
E' &\to + T E' \mid \varepsilon \\
T  &\to id
\end{aligned}
$$
*（已算得：$\text{FIRST}(E') = \{ +, \varepsilon \}$，$\text{FOLLOW}(E') = \{ \$ \}$）*

### 填表决策链：
* 对于 $E \to T E'$：由于 $\text{FIRST}(T E') = \{ id \}$，填入 $M[E, id]$。
* 对于 $E' \to + T E'$：由于 $\text{FIRST}(+ T E') = \{ + \}$，填入 $M[E', +]$。
* 对于 $E' \to \varepsilon$：因为是空产生式，查 $\text{FOLLOW}(E') = \{ \$ \}$，填入 $M[E', \$]$。

### 最终 LL(1) 分析表：

| 非终结符 | $id$ | $+$ | $\$$ |
| :---: | :--- | :--- | :--- |
| **$E$** | $E \to T E'$ | | |
| **$E'$** | | $E' \to + T E'$ | $E' \to \varepsilon$ |
| **$T$** | $T \to id$ | | |

> [!TIP] 决策边界
> 观察上面这张表：在行 `$E'$` 下，面对输入 `$+$` 时，我们选择展开为 `+ T E'`；而面对结束符 `$` 时，我们选择让它消失 `E' → ε`。
> 两个单元格独立且唯一，没有任何重叠，这证明了该文法是 LL(1) 文法。

---

## 4. 应试易错点（Common Mistakes）

1. **$\varepsilon$-产生式盲目乱填**：
   当遇到 $A \to \varepsilon$ 时，千万不要图省事把这一项直接填满整行或者乱填到 `$` 列。**它只能且必须填在 $\text{FOLLOW}(A)$ 包含的那些终结符列下**。
2. **多重定义格子未显式标记**：
   如果在填表时，发现一个格子里已经有产生式了，又需要填入另一个产生式，这说明**存在冲突**。在考试时，必须把两个产生式都写在该格子里（如 `A → a | A → ε`），并以此为证据证明文法非 LL(1)。
3. **忘记把 $A \to \varepsilon$ 动作填入表内**：
   虽然分析表没有 $\varepsilon$ 列，但 $A \to \varepsilon$ 是一步非常关键的归约/消元动作，漏填会导致分析器运行到该状态时由于找不到路而意外报错崩溃。

---

## 5. 关联概念与双链

* [[FIRST集合]] & [[FOLLOW集合]] ── 驱动填表算法的两大基石数据。
* [[Nullable]] ── 触发填表算法“第二步（FOLLOW 集合列填充）”的判定前置条件。
* [[LL(1)文法]] ── 分析表每个格子是否“单值”是判定 LL(1) 文法的唯一充要条件。
* [[LL(1)预测分析过程追踪（分析器运行的慢动作回放）|Parser Trace]] ── 分析表构造完毕后，将直接作为“动作指令库”来驱动分析栈的运行。
