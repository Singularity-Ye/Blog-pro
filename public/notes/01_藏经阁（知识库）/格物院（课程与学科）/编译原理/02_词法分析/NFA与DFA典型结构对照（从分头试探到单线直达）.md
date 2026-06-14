---
title: NFA与DFA典型结构对照（从分头试探到单线直达）
english: NFA and DFA Structural Comparison
type: concept
aliases:
  - NFA与DFA典型结构对照（从分头试探到单线直达）
  - NFA与DFA对照表
tags: [编译原理, 词法分析, 自动机, 概念对比]
created: 2026-06-12
source_chapter:
  - 2
used_in_chapter:
  - 2
---
# NFA与DFA典型结构对照（从分头试探到单线直达）

在词法分析的系统构建中，理解同一个正则表达式在 **NFA** 和 **DFA** 下的不同物理呈现形式，能够帮助我们直观感受自动机化简（子集构造法）的实际威力。

> [!NOTE] 双轨直觉：草稿本与最终设计图
> - **NFA 像“写满辅助线的草稿纸”**：它使用 Thompson 构造法，采用递归嵌套的思路，为了保证逻辑正确，引入了大量免费的滑梯（$\varepsilon$ 状态边）。构造非常机械、简单，但状态繁多。
> - **DFA 像“精简利落的最终图纸”**：它通过合体装袋（[[子集构造法]]）和状态化简，合并了所有冗余分身，消除了所有免费传送门，用最少的状态和直连边实现同等逻辑。

---

## 典型结构直观对比表

我们针对正则表达式的 6 种基本语法结构，对比其在 **Thompson NFA 构造** 与 **化简后的确定性 DFA** 下的状态转移图：

### 1. 字符匹配 `a`
*   **正则表达式**：`a`
*   **NFA 结构**：
    ```mermaid
    flowchart LR
        s1((s_1)) -->|a| s2(((s_2)))
    ```
*   **DFA 结构**：
    ```mermaid
    flowchart LR
        s0((s_0)) -->|a| s1(((s_1)))
    ```
*   **化简原理说明**：结构完全一致。对于单一字符匹配，确定性与非确定性的物理实现是一样的。

---

### 2. 连接结构 `ab`
*   **正则表达式**：`ab`
*   **NFA 结构**：
    ```mermaid
    flowchart LR
        s_in((in)) -->|a| s_mid((mid))
        s_mid -->|b| s_out(((out)))
    ```
*   **DFA 结构**：
    ```mermaid
    flowchart LR
        s0((s_0)) -->|a| s1((s_1))
        s1 -->|b| s2(((s_2)))
    ```
*   **化简原理说明**：完全等价。由于字符匹配是串行发生的，且无分支歧义，两者结构完全一致。

---

### 3. 选择结构 `a|b`
*   **正则表达式**：`a|b`
*   **NFA 结构 (Thompson)**：
    ```mermaid
    flowchart LR
        s_in((in)) -->|ε| a_start((a_start))
        s_in -->|ε| b_start((b_start))
        a_start -->|a| a_end((a_end))
        b_start -->|b| b_end((b_end))
        a_end -->|ε| s_out(((out)))
        b_end -->|ε| s_out
    ```
*   **DFA 结构**：
    ```mermaid
    flowchart LR
        s0((s_0)) -->|a, b| s1(((s_1)))
    ```
*   **化简原理说明**：NFA 使用 $\varepsilon$ 边分流再合流，引入了 6 个状态；而 DFA 则是将初态直接分流并导向同一个接受态，将状态数直接从 **6 个压缩为 2 个**。

---

### 4. 克林闭包 `a*`
*   **正则表达式**：`a*`
*   **NFA 结构 (Thompson)**：
    ```mermaid
    flowchart LR
        s_in((in)) -->|ε| r_start((a_start))
        r_start -->|a| r_end((a_end))
        r_end -->|ε| r_start
        s_in -->|ε| s_out(((out)))
        r_end -->|ε| s_out
    ```
*   **DFA 结构**：
    ```mermaid
    flowchart LR
        s0(((s_0))) -->|a| s0
    ```
*   **化简原理说明**：NFA 为了表示“匹配 0 次绕行”和“匹配多次循环”，使用了 4 个状态和多条 $\varepsilon$ 边；而 DFA 由于“初态本身即是终态（代表 0 次匹配）”，且可以直接自环（代表多次匹配），因此将状态成功缩减为 **1 个**！

---

### 5. 正闭包 `a+`
*   **正则表达式**：`a+`
*   **NFA 结构 (Thompson)**：
    ```mermaid
    flowchart LR
        s_in((in)) -->|a| s_mid((mid))
        s_mid -->|ε| s_in
        s_mid -->|ε| s_out(((out)))
    ```
*   **DFA 结构**：
    ```mermaid
    flowchart LR
        s0((s_0)) -->|a| s1(((s_1)))
        s1 -->|a| s1
    ```
*   **化简原理说明**：NFA 通过内部的 $\varepsilon$ 环回和出口实现多次匹配；DFA 则是通过“初态跨一步到接受态（保证至少 1 次），然后在接受态自环”来实现，消除了空转移，状态数从 **3 个压缩为 2 个**。

---

### 6. 可选结构 `a?`
*   **正则表达式**：`a?`
*   **NFA 结构 (Thompson)**：
    ```mermaid
    flowchart LR
        s_in((in)) -->|a| s_out(((out)))
        s_in -->|ε| s_out
    ```
*   **DFA 结构**：
    ```mermaid
    flowchart LR
        s0(((s_0))) -->|a| s1(((s_1)))
    ```
*   **化简原理说明**：NFA 包含直连的 `a` 边和绕行的 $\varepsilon$ 边；DFA 则将初态本身设为接受态（代表 0 次），刷 `a` 跳转到另一个接受态（代表 1 次），去除了 $\varepsilon$ 边。

---

## 💡 总结与应试启发

从对照表中可以明显看出：
1. **状态数量暴减**：Thompson NFA 引入了大量的 $\varepsilon$ 跳转状态，导致状态网十分臃肿；DFA 则将所有“等价的可能路径”打包（即子集收网），极大地压缩了状态总数。
2. **零空跳运行**：DFA 移除了所有不消耗字符的 $\varepsilon$ 转移，计算机在查表运行程序时，不需要做任何克隆或回溯，运行性能呈指数级提升。
3. **关联卡片**：如果需要手算具体的转换细节，请查看典型题型 [[01_正规式转NFA与DFA套路]] ；关于合体打包的具体算子，请查阅 [[子集构造法]]。
