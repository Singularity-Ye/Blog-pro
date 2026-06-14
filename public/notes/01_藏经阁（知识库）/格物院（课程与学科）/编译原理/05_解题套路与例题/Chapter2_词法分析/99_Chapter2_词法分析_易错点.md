---
title: 99_Chapter2_词法分析_易错点
english: Chapter 2 Scanning Common Mistakes
type: mistake-index
aliases:
  - Chapter 2 Scanning Common Mistakes
  - Chapter 2 词法分析易错点
  - 自动机易错点
  - Chapter2_词法分析_易错点
source_chapter:
  - 2
used_in_chapter:
  - 2
tags:
  - 编译原理
  - 词法分析
  - 易错点
status: complete
created: 2026-06-13
---
# Chapter 2 词法分析易错点

> 来源：老师课堂点评 + 作业批改。考前必看。
>
> 记忆句：**子集构造首态必求闭包，最小化分组终态非终必拆。**

---

## 🔴 致命错误

### 1. 子集构造法初态漏求 $\varepsilon$-closure 闭包

**错误写法：**
把 NFA 转换为 DFA 时，直接把 NFA 的启动状态 $s_0$ 作为 DFA 的初始状态集：
$$I_0 = \{ s_0 \}$$

**问题：** 初始状态集**必须**是 $s_0$ 通过所有可能的 $\varepsilon$ 转移能到达的所有状态的集合（即 $s_0$ 的 $\varepsilon$ 闭包）。如果漏掉，后续推导的所有状态集和转移边都将彻底错乱。

**推荐写法：**
$$I_0 = \varepsilon\text{-closure}(s_0)$$

> **English Pattern:** The starting state of the constructed DFA must be $\varepsilon\text{-closure}(s_0)$, where $s_0$ is the start state of the NFA, rather than just $\{s_0\}$.

---

### 2. DFA 最小化（Hopcroft 算法）初始未区分终态与非终态

**错误写法：**
将所有自动机状态塞进一个大集合，然后直接开始找输入边裂分。

**问题：** 终态（接受状态 $F$）和非终态（非接受状态 $S \setminus F$）具有本质不同的行为（接受输入 vs 拒绝/继续输入），它们**绝不能合并**。初始划分必须将其彻底独立。

**推荐写法：**
设定初始划分集合：
$$P_0 = \{ S \setminus F,\ F \}$$

> **English Pattern:** The Hopcroft algorithm must begin with an initial partition that splits the state set into two groups: accepting states $F$ and non-accepting states $S \setminus F$.

---

### 3. DFA 转换表/状态图中漏标记“接受状态 (接受双圈)”

**错误写法：**
算出了 DFA 状态集合 $A = \{1, 2\}, B = \{3, 4, 5\}$，但最后画图时全部画成单圈。

**问题：** 如果 NFA 的接受状态为 $5$，而 DFA 状态集 $B$ 包含了 $5$，那么状态 $B$ 就变成了 DFA 的**接受状态**。在最终图上必须画成**双圈**，转换表上必须加星号 `*`，否则阅卷老师会认为你没写完。

**推荐做法：**
*   **规则**：若 DFA 状态子集中包含任意一个 NFA 的接受状态，该子状态即为接受状态。
*   **呈现**：图上用双圈，表上用 `*` 或其他高亮标出。

---

## 🟡 高频扣分点

### 4. 正规式混淆 `a*b*` 与 `(ab)*`

**错误描述：**
将“任意个 a 跟着任意个 b”写成了 `(ab)*`。

**问题：** 
*   `a*b*` 表示所有的 a 在前，所有的 b 在后（如 `aaabbb`, `a`, `bbb`, `ε` 均可）。
*   `(ab)*` 表示 a 和 b 必须交替成对出现（如 `ababab`, `ε`）。
*   在正规式构造中，极易因审题不清混淆这两个符号，导致整题零分。

---

### 5. DFA 构造时将转移符号“标在状态圈里”

**错误画法：**
在关键字 Scanner 设计大题中（如 [[Ex2.9_DFA构造]]），错误地把 `'c'`, `'a'`, `'s'`, `'e'` 这些字符标在了状态节点里面。

**问题：** 有限自动机（FA）的转移字符必须写在**转移弧（有向边）**上。状态圈里只应写状态编号（如 $0, 1, 2$）或状态名称。圈里写字符是严重的概念混淆。

---

### 6. Thompson 构造 NFA 漏画 $\varepsilon$ 边

**错误描述：**
构造 $a^*$ 对应的 NFA 时，省略了跳过 $a$ 节点的 $\varepsilon$ 边，或者将闭包循环边连错。

**推荐做法：** 严格遵循 Thompson 标准结构：
```text
      ┌────── ε ──────┐
      ▼               │
──►(start)──►( 1 )──►( 2 )──►(end)
      │                       ▲
      └────────── ε ──────────┘
```

---

## 🟢 英文答题检查清单

- [ ] DFA 的初始集是否写成了 $I_0 = \varepsilon\text{-closure}(s_0)$ 并列出了完整闭包集？
- [ ] 子集构造法迭代中，每次 move 后是否都求了外层 $\varepsilon\text{-closure}$？
- [ ] 得到的 DFA 终态集中，所有包含 NFA 接受态的子状态是否都标了 `*` 或画了双圈？
- [ ] DFA 最小化时，初始第一步是否明确将状态拆成了终态集和非终态集？
- [ ] 最小化裂分（Refine）时，是否所有输入符号（如 $a$ 和 $b$）均作为依据进行了裂分测试？
- [ ] 正规式里，乘性连接 `ab`（连接）和加性选择 `a|b`（选择）符号是否书写规范？
- [ ] 自动机图中，初始状态是否画了带箭头的入口指示线？

---

## 🧠 最小复习口诀

- **初态起跑**：先做闭包，再做 move
- **终态标记**：只要子集含接受，大状态就画双圈
- **最小化第一步**：非终、终态切两半，井水不犯河水
- **裂分测试**：去往不同老组的，必须当场切开
- **状态弧线**：字符写在箭头线，状态圈内写数字
