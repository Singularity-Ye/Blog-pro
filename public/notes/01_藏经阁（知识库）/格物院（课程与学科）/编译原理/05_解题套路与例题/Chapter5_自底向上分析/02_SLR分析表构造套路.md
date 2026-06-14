---
title: 02_SLR分析表构造套路
english: Recipe for SLR Parsing Table Construction
type: recipe
aliases:
  - SLR分析表构造
  - SLR Parsing Table Recipe
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
related_concepts:
  - ACTION表
  - GOTO表
  - SLR(1)分析算法
  - FOLLOW集合
common_mistakes:
  - 99_Chapter5_自底向上分析_易错点
created: 2026-06-11
---

# SLR(1) 分析表构造套路

> [!NOTE] 戏说套路：以 FOLLOW 集合为安检盾牌的“填表四字诀”
> 填表就是把我们的安全防护站（DFA状态图）翻译成调度室的二维跳转表（ACTION/GOTO表），只需要记住四字真言：
> 1. **“移”（移进）**：如果圆点后面是终结符（普通观众 $a$），查出它去往状态 $j$，就在 ACTION 表的第 $a$ 列填入 `s_j`。
> 2. **“归”（归约）**：如果圆点已经到头（$A \to \alpha \cdot$），准备封箱打包。先拿出安检喇叭（FOLLOW集）核对，只有**眼前的输入符号出现在 $\text{FOLLOW}(A)$ 列表里**，才允许在对应列填入 `r_k`（产生式编号为 $k$）。其他不相干的列坚决留空，这就是防撞车安检。
> 3. **“接”（接受）**：如果碰见终极大 BOSS $S' \to S \cdot$（已冲过红线），且眼前的输入是哨兵 `$`，立马在 `$` 列填上 `acc`。
> 4. **“转”（跳转）**：如果圆点后面是非终结符（大写字母/大咖 $A$），它不能从外面读进来，只能是归约后内部生成的，所以在 GOTO 表的第 $A$ 列写上跳转的目标状态号 $j$。

---

## 📐 分析表填表法则 (The Parsing Table Rules)

设当前状态为 $i$，对应项目集为 $I_i$，其填表动作规则分为以下四条定理：

### 1. 移进动作规则 (Shift Action)
若项目 $A \to \alpha \cdot a \beta \in I_i$ 且 $a$ 为 **终结符** ($a \in V_T$)：
- 若 $\text{GOTO}(I_i, a) = I_j$，则在 ACTION 表的第 $i$ 行、第 $a$ 列填入：
  $$
  \text{ACTION}[i, a] = s_j \quad (\text{Shift } j)
  $$

### 2. 归约动作规则 (Reduce Action)
若项目 $A \to \alpha \cdot \in I_i$ 且 **$A \neq S'$** （即非增广起始符归约）：
- 对 **所有** 属于非终结符 $A$ 的 FOLLOW 集合的终结符 $a$ ($a \in \text{FOLLOW}(A)$)，在 ACTION 表的第 $i$ 行、第 $a$ 列填入：
  $$
  \text{ACTION}[i, a] = r_k \quad (\text{Reduce by } A \to \alpha, \text{其中 } k \text{ 为该产生式的编号})
  $$

### 3. 接受动作规则 (Accept Action)
若项目 $S' \to S \cdot \in I_i$ （增广文法接收态）：
- 在 ACTION 表的第 $i$ 行、结束符 **`$` 列** 填入：
  $$
  \text{ACTION}[i, \text{＄}] = \text{acc}
  $$

### 4. 跳转动作规则 (Goto Action)
对于非终结符 $A \in V_N$ 的状态转移：
- 若 $\text{GOTO}(I_i, A) = I_j$，则在 GOTO 表的第 $i$ 行、第 $A$ 列填入状态编号：
  $$
  \text{GOTO}[i, A] = j
  $$

---

## 🚧 冲突检测与文法判定 (Conflict Check)

在填表过程中，如果发现 **同一个格子 $[i, a]$ 被填入了两个或多个动作** ，则说明该文法在当前状态下存在二义性：

1.  **移进-归约冲突 (Shift-Reduce Conflict)** ：同时被填入 $s_j$ 和 $r_k$。
2.  **归约-归约冲突 (Reduce-Reduce Conflict)** ：同时被填入 $r_j$ 和 $r_k$。

> [!IMPORTANT]
> **文法判定结论** ：
> - 若填表完成且 **无任何多重定义格子** $\implies$ 该文法是 **SLR(1) 文法** 。
> - 若存在任何冲突 $\implies$ 该文法 **不是** SLR(1) 文法。

## 📐 经典可视化表构造步骤 (Table Construction Walkthrough)

基于上述最简文法和 DFA，我们计算 $\text{FOLLOW}$ 集合：
*   $\text{FOLLOW}(S') = \{ \text{＄} \}$
*   $\text{FOLLOW}(S) = \{ \text{＄} \}$
*   $\text{FOLLOW}(A) = \{ \textbf{d} \}$

### 1. 填表映射拆解：

| 状态 | 包含项目 | 适用填表规则与推导 | 填表项 |
|:---:|---|---|---|
| **$I_0$** | $S' \to \cdot S$<br>$S \to \cdot A \textbf{d}$<br>$A \to \cdot \textbf{x}$ | 点后为非终结符 $S$（查 GOTO）<br>点后为非终结符 $A$（查 GOTO）<br>点后为终结符 $\textbf{x}$（跳转至 $I_3$） | $\text{GOTO}[0, S] = 1$<br>$\text{GOTO}[0, A] = 2$<br>$\text{ACTION}[0, \textbf{x}] = s_3$ |
| **$I_1$** | $S' \to S \cdot$ | 增广文法接收态（结束符 `$`） | $\text{ACTION}[1, \$] = \text{acc}$ |
| **$I_2$** | $S \to A \cdot \textbf{d}$ | 点后为终结符 $\textbf{d}$（跳转至 $I_4$） | $\text{ACTION}[2, \textbf{d}] = s_4$ |
| **$I_3$** | $A \to \textbf{x} \cdot$ | 归约 (2) 号产生式，仅在 $\text{FOLLOW}(A) = \{\textbf{d}\}$ 列填入 | $\text{ACTION}[3, \textbf{d}] = r_2$ |
| **$I_4$** | $S \to A \textbf{d} \cdot$ | 归约 (1) 号产生式，仅在 $\text{FOLLOW}(S) = \{\text{＄}\}$ 列填入 | $\text{ACTION}[4, \text{＄}] = r_1$ |

### 2. 最终生成的 SLR(1) 分析表：

| 状态 | ACTION: x | ACTION: d | ACTION: $ | GOTO: S | GOTO: A |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | $s_3$ | | | 1 | 2 |
| **1** | | | acc | | |
| **2** | | $s_4$ | | | |
| **3** | | $r_2$ | | | |
| **4** | | | $r_1$ | | |

---

## 🚨 避坑清单与评分警示

> [!CAUTION] 1. 混淆 LR(0) 与 SLR(1) 的归约填表规则（极高频失分点）
> - **LR(0) 归约** ：一旦状态 $I_i$ 中含有归约项目 $A \to \alpha \cdot$，ACTION 表的第 $i$ 行 **所有列（包括所有终结符与 `$`）** 均填入 $r_k$。不看任何展望符。
> - **SLR(1) 归约** ：仅在属于 **$\text{FOLLOW}(A)$** 的列中填入 $r_k$。
> *考试时必须看清题目要求的是构造 LR(0) 还是 SLR(1) 分析表。写错会导致整行 reduce 动作全部错位。*

> [!WARNING] 2. 空产生式（Epsilon Production）的归约行定位
> 对于 $A \to \varepsilon$，在 DFA 中对应的项目为 $A \to \cdot$。由于点已经在最右侧，这属于 **归约项目** 。
> - **填表动作** ：如果 $A \to \cdot \in I_i$，则对于所有 $a \in \text{FOLLOW}(A)$，格子 $[i, a]$ 必须填入该产生式对应的归约动作 $r_k$。
> - *易错：很多学生误以为点 `·` 在最左侧是移进项目，导致漏填归约动作，使得分析表无法运行。*

---

## 📝 实战演练推荐

*   [[Ex5_SLR综合题_括号文法]] —— 经典的无空产生式 SLR 表构造与冲突消解。
*   [[Ex5.2_SLR分析与LR0冲突_空产生式文法]] —— 包含空产生式、展示了使用 FOLLOW 集合完美拦截并消解 LR(0) 冲突的经典过程。