---
aliases:
- Follow 集合
- FOLLOW Set
- Follow Set
- FOLLOW集合（FOLLOW Set）
- FOLLOW集合：紧随其后的安全守候字符集
created: 2026-06-10
english: FOLLOW Set
source_chapter:
- 4
tags:
- 编译原理
- 语法分析
- 自顶向下
title: FOLLOW集合
type: concept
used_in_chapter:
- 4
- 5
---
# FOLLOW集合：紧随其后的安全守候字符集

> [!NOTE] 双轨直觉：非终结符的“贴身右保镖”
> 在文法推导的所有可能句子中，**能够紧跟在某个非终结符 $A$ 右侧的终结符集合**（包括结束符 `$`）。
> $\text{FOLLOW}(A)$ 描述的是 $A$ 的“右上下文环境”，它不取决于 $A$ 自己能变成什么，而是取决于 **$A$ 在其他产生式右部被塞在了哪里**。

---

## 1. 直觉认知（Intuitive View）

> [!NOTE] 大白话直觉：舞台演员的被动人际关系与三大铁律
> 想象文法里的每一个符号都是舞台上的演员：
> * **FIRST 集合是演员的主动技能**：问的是“演员 $A$ 独自上台展开后，他露出的第一张脸是什么样（能吐出的第一个符号）”。
> * **FOLLOW 集合是演员的被动人际关系**：问的是“在整出话剧中，不管剧情怎么演，当演员 $A$ 演完谢幕时，**紧挨着站在他右手边**的演员可能是谁”。
>   
> ### 被动关系的三大铁律：
> 1. **老大的特权**：主角（文法开始符 $S$）演完的时候，话剧就结束了。所以，结束符 `$` 必然贴身站在 $S$ 的右边（$\text{FOLLOW}(S)$ 必有 `$`）。
> 2. **邻居的馈赠**：如果在某场戏中，剧本写着 $A \to \alpha B C$，说明演员 $B$ 演完后，立刻轮到 $C$ 上场。因此，$B$ 的右贴身保镖就是 $C$ 的首字符（$\text{FIRST}(C)$ 中的非空元素）。
> 3. **老大的遗产（继承）**：如果在戏里，剧本写着 $A \to \alpha B$（或者 $A \to \alpha B C$ 且 $C$ 是个随时可能选择隐形不加的选配料）。当 $B$ 演完，后面没人了（或者后面的 $C$ 隐形不加了），那谁站在 $B$ 的右边呢？很显然， **谁站在老大 $A$ 的右边，谁就得顺理成章地站在 $B$ 的右边** 。这就是 $\text{FOLLOW}(A)$ 传播并复制给 $\text{FOLLOW}(B)$ 的物理本质。

---

## 2. 数学定义与传播法则

### 形式化定义
对于非终结符 $A \in V_N$，其 FOLLOW 集合定义为：
$$FOLLOW(A) = \{ a \in V_T \cup \{\$\} \mid S \Rightarrow^* \alpha A a \beta \}$$
其中 $S$ 是文法的开始符号，`$` 是输入流的结束标记。

### 级联可空 FOLLOW 传播 ── 大白话直觉与排队接盘模型

在产生式 $A \to \alpha B \beta$ 中，我们想计算 $B$ 的 FOLLOW 集合（即有哪些终结符可能紧跟在 $B$ 后面）。我们可以将后面的尾巴 $\beta$ 展开为符号串 $X_1 X_2 \dots X_n$。

在考场上，我们完全可以凭借日常超市排队的直觉逻辑，秒杀这类题目：

> **💡 超市排队接盘模型**
> 
> 想象大家在超市排队买单。$B$ 正在排队，你想知道**谁可能排在 $B$ 的屁股后面**（即 $\text{FOLLOW}(B)$）：
> 
> 1. **邻居排队**：如果队列里 $B$ 后面跟着 $X_1$。那排在 $B$ 屁股后面的，当然是 $X_1$ 队伍里排在最前面的那个人（即 $\text{FIRST}(X_1) \setminus \{\varepsilon\}$）。
> 2. **临时退队（可空）**：如果 $X_1$ 是个随时可能因为“手机没电”或“临时不买”而退队的人（可空）。一旦 $X_1$ 隐形退队了，$B$ 屁股后面排着的就变成了再往后的 $X_2$（首字符）。这即是“可空穿透”。
> 3. **老大接盘（继承）**：如果 $B$ 后面的所有人（$X_1$ 到 $X_n$）全部因为各种原因临时退队了，或者 $B$ 本来就处于产生式的最右端（没有邻居）。那么， **谁排在他们整个团队的老大 $A$ 后面，谁就得接盘，直接顶上来排在 $B$ 的后面** （即 $\text{FOLLOW}(B)$ 继承 $\text{FOLLOW}(A)$）。
> 
> **总结**：计算 FOLLOW 就是“排队等候”。右边的邻居退队了，更右边的人就顶上；如果后面的人全退队了，老大的后继者就必须顶上来给 $B$ 接盘。

> [!NOTE]- 📐 理论推导公式（学术论文与教材标准版，可折叠不看）
> 对于学术场景，其形式化定义如下：
> 
> $$
> \text{FOLLOW}(B) \gets \text{FOLLOW}(B) \cup \bigcup_{i=1}^{n} \{ a \in \text{FIRST}(X_i) \setminus \{\varepsilon\} \mid \forall j < i, \text{Nullable}(X_j) \}
> $$
> 
> 当 $\forall j \le n, \text{Nullable}(X_j)$ 时：
> 
> $$
> \text{FOLLOW}(B) \gets \text{FOLLOW}(B) \cup \text{FOLLOW}(A)
> $$

---

## 3. 规范答题计算示例（以表格进行迭代计算）

在考试中，针对级联关系复杂的文法，建议在计算出 **FIRST 集合与 Nullable 属性** 后，采用 **不动点迭代法（Fixed-Point Iteration）** 自底向上求解 FOLLOW 集合。

### 经典考题文法
$$
\begin{aligned}
S &\to A B C \\
A &\to a A \mid \varepsilon \\
B &\to b B \mid M \\
M &\to c \mid \varepsilon \\
C &\to d C \mid \varepsilon
\end{aligned}
$$

*（已知各符号的 FIRST 集合及 Nullable 属性：）*
- $\text{FIRST}(S) = \{ a, b, c, d, \varepsilon \}, \quad \text{Nullable}(S) = \text{True}$
- $\text{FIRST}(A) = \{ a, \varepsilon \}, \quad \text{Nullable}(A) = \text{True}$
- $\text{FIRST}(B) = \{ b, c, \varepsilon \}, \quad \text{Nullable}(B) = \text{True}$
- $\text{FIRST}(M) = \{ c, \varepsilon \}, \quad \text{Nullable}(M) = \text{True}$
- $\text{FIRST}(C) = \{ d, \varepsilon \}, \quad \text{Nullable}(C) = \text{True}$

### FOLLOW 不动点迭代执行跟踪表

下表展示了 Jacobi 风格的同步迭代更新过程（即当前轮次计算仅依赖于上一轮次的集合状态）：

| 非终结符  | Round 0 (初始化) | Round 1             | Round 2 (收敛不动点)     | 最终推导依据与关系链说明                                                                                                                              |
| :---: | :------------ | :------------------ | :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **S** | $\{ \$ \}$    | $\{ \$ \}$          | $\{ \$ \}$          | 开始符号，默认包含结束符 `$`。                                                                                                                         |
| **A** | $\emptyset$   | $\{ b, c, d, \$ \}$ | $\{ b, c, d, \$ \}$ | $S \to A B C$。因 $B C$ 可空，并入 $\text{FIRST}(B) \setminus \{\varepsilon\}$、$\text{FIRST}(C) \setminus \{\varepsilon\}$ 及 $\text{FOLLOW}(S)$。 |
| **B** | $\emptyset$   | $\{ d, \$ \}$       | $\{ d, \$ \}$       | $S \to A B C$。因 $C$ 可空，并入 $\text{FIRST}(C) \setminus \{\varepsilon\}$ 及 $\text{FOLLOW}(S)$。                                               |
| **M** | $\emptyset$   | $\emptyset$         | $\{ d, \$ \}$       | $B \to M$。$M$ 位于产生式尾部，完全继承并复制上一轮的 $\text{FOLLOW}(B)$。                                                                                     |
| **C** | $\emptyset$   | $\{ \$ \}$          | $\{ \$ \}$          | $S \to A B C$。$C$ 位于产生式尾部，完全继承 $\text{FOLLOW}(S)$。                                                                                        |


> [!TIP] 迭代细节解析
> 1. **Round 0**: 开始符号 $S$ 初始化为 $\{ \$ \}$，其余非终结符初始化为空集。
> 2. **Round 1**:
>    - 计算 $A$：根据 $S \to A B C$，扫描 $A$ 的右侧。右侧为 $B C$。
>      - 引入 $\text{FIRST}(B) \setminus \{\varepsilon\} = \{ b, c \}$。
>      - 由于 $B$ 可空，向右穿透，引入 $\text{FIRST}(C) \setminus \{\varepsilon\} = \{ d \}$。
>      - 由于 $B C$ 均可空，一路穿透至尾部，继承并入 Round 0 的 $\text{FOLLOW}(S) = \{ \$ \}$。
>      - 综上，$\text{FOLLOW}(A) \gets \{ b, c, d, \$ \}$。
>    - 计算 $B$：扫描右邻 $C$。引入 $\text{FIRST}(C) \setminus \{\varepsilon\} = \{ d \}$。由于 $C$ 可空，继承 Round 0 的 $\text{FOLLOW}(S) = \{ \$ \}$，得到 $\{ d, \$ \}$。
>    - 计算 $C$：位于 $S \to A B C$ 尾部，直接继承 Round 0 的 $\text{FOLLOW}(S) = \{ \$ \}$。
>    - 计算 $M$：根据 $B \to M$ 继承 $\text{FOLLOW}(B)$。但上一轮 $\text{FOLLOW}(B) = \emptyset$，故本轮仍为 $\emptyset$。
> 3. **Round 2**:
>    - 计算 $M$：继承上一轮的 $\text{FOLLOW}(B) = \{ d, \$ \}$，成功并入元素。
>    - 其它非终结符集合与上一轮一致。
> 4. **Round 3**: 全员无新元素并入，宣告收敛。

---

## 4. 应试易错点（Common Mistakes）

> [!CAUTION] 极高频扣分区
> 1. **方向找反了（致命错误）**：求 $\text{FOLLOW}(A)$ 时，许多同学习惯性去查“以 $A$ 为左部的产生式 $A \to \alpha$”。 **求 FOLLOW(A) 必须扫描所有产生式的右部，找出所有出现符号 A 的位置！**  与 $A$ 开头的产生式毫无关系。
> 2. **集合符号漏写**：$\text{FOLLOW}(E) = \$ , )$ 是严重格式错误，必须写成集合括弧格式：$\text{FOLLOW}(E) = \{ \$, ) \}$。
> 3. **遗漏传播链中的 Nullable 项**：对于 $S \to u B D z$。当 $D$ 可空时，$\text{FOLLOW}(B)$ 不仅有 $\text{FIRST}(D)$，还**必须**有 $z$（即穿透 $D$ 继承后面的符号）。如果 $D$ 处于尾部且可空，则必须完全继承 $\text{FOLLOW}(S)$。
> 4. **$\varepsilon$ 漏填或错填**：$\varepsilon$ 绝对不能存在于任何非终结符的 $\text{FOLLOW}$ 集合中。

---

## 5. 关联概念与双链

* [[FIRST集合]] ── 姐妹集合，提供求 FOLLOW 时右侧邻居的首字符信息。
* [[Nullable]] ── 决定了 FOLLOW 集合在产生式中是否可以“穿透尾部非终结符”向左传播。
* [[LL(1)预测分析表（自顶向下分析的方向指示牌）|LL(1)分析表]] ── 在遇到空产生式 $A \to \varepsilon$ 时，利用 $\text{FOLLOW}(A)$ 中的终结符指引，将该产生式填入分析表的对应列。
* [[SLR(1)分析算法]] ── 进入 Chapter 5 后，$\text{FOLLOW}$ 集合将作为 SLR(1) 归约动作的“安检门”限制条件。
