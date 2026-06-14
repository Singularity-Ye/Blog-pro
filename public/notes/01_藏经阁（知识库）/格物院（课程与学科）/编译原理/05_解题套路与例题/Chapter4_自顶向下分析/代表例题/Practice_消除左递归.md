---
title: Practice_消除左递归
english: "Example: Left Recursion Elimination Practice"
type: example
chapter_type: representative
aliases:
  - Left Recursion Elimination Practice
  - Practice Eliminating Left Recursion
  - 消除左递归练习
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
  - left-recursion
  - indirect-left-recursion
  - grammar-transformation
source: practice
status: active
related_recipes:
  - "[[05_消除左递归套路]]"
related_concepts:
  - "[[左递归]]"
  - "[[间接左递归]]"
  - "[[LL(1)文法]]"
common_mistakes:
  - "[[99_Chapter4_自顶向下分析_易错点]]"
created: 2026-06-10
---
# Practice — 消除左递归 Eliminate Left Recursion

## Original Question

<img src="../原题图片/Ch4_Practice_消除左递归_原题.png" alt="原题图片" width="465">

Eliminate left recursion from the following grammar:

```text
S → S T S | S T | T
T → T a | T b | U
U → T | c
```

## 中文题意

对给定 grammar 消除 left recursion。

这题不是简单的直接左递归题。它同时包含：
1. S 的 **general left recursion**
2. T 的 **direct left recursion**
3. T 和 U 之间的 **indirect left recursion**

---

## Artifacts & Images / 答案与原图归档

### 官方标准答案
<img src="../原题图片/Ch4_Practice_消除左递归_标准答案_01.png" alt="官方标准答案" width="650">

---

### 学生作答手稿
<img src="../我的答案图片/Ch4_Practice_消除左递归_我的答案_01.jpg" alt="我的解答" width="600">

---

## Diagnostic & Error Analysis / 错因与技巧分析

> [!CAUTION] 核心技巧：代入消元（Substitution）
> 本题的难点在于 **间接左递归（Indirect Left Recursion）** 的识别和规范化消除步骤。

### 1. 识别出文法中的三个左递归：
1. **$S \to S T S \mid S T \mid T$**：$S$ 的直接/一般左递归；
2. **$T \to T a \mid T b \mid U$ 且 $U \to T \mid c$**：$T$ 与 $U$ 之间的**间接左递归**；
3. **$T \to T a \mid T b \mid T \mid c$**：代入后得到的 $T$ 的直接/一般左递归（包含 $T \to T$ 的自循环项）。

### 2. 错因分析：为什么手写解答偏离了标准？
* **手写的改写方式**：你直接将 $T$ 和 $U$ 独立进行了左递归消除公式的套用，写成了：
  $$T \to U T', \quad T' \to a T' \mid b T' \mid \varepsilon$$
  $$U \to c U', \quad U' \to T' U' \mid \varepsilon$$
  虽然这在字面上打破了左递归，但不符合标准的**间接左递归消除算法（依靠代入消元）**。
* **规范解题法（老师推荐技巧）**：
  * **第一步：代入消元**。把产生式 $U \to T \mid c$ 直接代入到 $T \to T a \mid T b \mid U$ 的 $U$ 中。代入后得到：
    $$T \to T a \mid T b \mid T \mid c$$
    此时，间接左递归被成功转化为了直接左递归。
  * **第二步：套公式消除直接左递归**。因为 $T \to T$ 是自循环项（无终结符产出），可以归入 $\varepsilon$ 动作。应用公式后得到：
    $$T \to c T'$$
    $$T' \to a T' \mid b T' \mid \varepsilon$$
  * **第三步：消除死码**。由于代入后，非终结符 $U$ 从文法开始符号 $S$ 开始不再可达（$S \to T S'$, $T \to c T'$，两者均不涉及 $U$），$U$ 变为了死码，可以直接从文法中完全消去。

---

## Type 题型

Grammar transformation / Eliminating left recursion（直接 + 间接）

核心目标：

```text
Identify direct and indirect left recursion
↓
Use substitution to remove indirect left recursion
↓
Apply standard left recursion elimination rule
↓
Rewrite grammar without left recursion
```

## Related Concepts

- [[左递归|Left Recursion]] — 左递归导致 LL(1) parser 无限循环
- [[间接左递归|Indirect Left Recursion]] — 通过其他非终结符绕回来的递归
- grammar transformation — 文法等价改写
- [[LL(1)文法|LL(1)]] — 消除左递归是 LL(1) 的前置条件

## Related Recipes

- [[05_消除左递归套路]] — 直接左递归公式 + 间接左递归 substitution 方法

---

## Step 1: 识别 S 的左递归

原 production：

```text
S → S T S | S T | T
```

其中 `S → S T S` 和 `S → S T` 都以 S 开头 → **direct left recursion**。

标准形式 $A \to A\alpha_1 \mid A\alpha_2 \mid \beta$：

```text
A  = S,  α1 = T S,  α2 = T,  β = T
```

改写为：

```text
S  → T S'
S' → T S S' | T S' | ε
```

> 不同 productions 分行写，不要用逗号分隔。

---

## Step 2: 识别 T 和 U 的间接左递归

原 grammar 中：

```text
T → T a | T b | U
U → T | c
```

除了 `T → T a` 和 `T → T b` 的 direct left recursion 外，还有：

```text
T ⇒ U ⇒ T
```

T 可以通过 U 再回到 T → **indirect left recursion**。

---

## Step 3: 用 substitution 消除 indirect left recursion

因为 `U → T | c`，把 U 的 productions 代入 T：

```text
T → T a | T b | T | c
```

现在 T 和 U 之间的 indirect left recursion 被转成了 T 的 direct/general left recursion。

---

## Step 4: 消除 T 的 general left recursion

标准形式 $A \to A\alpha_1 \mid A\alpha_2 \mid \dots \mid \beta$：

```text
A  = T
α1 = a
α2 = b
α3 = ε   ← 来自 T → T（自循环）
β  = c
```

改写为：

```text
T  → c T'
T' → a T' | b T' | ε
```

> `T → T` 是自循环 production，不会产生新的 terminal，可以吸收到 $\varepsilon$ 情况中。

---

## Step 5: 处理 U

原本 `U → T | c`。在 substitution 后，U 不再需要保留为核心递归结构。

由于 `T → c T'` 已经覆盖了由 `c` 开始的结构，很多参考答案会直接把 U 消掉。

---

## Final Answer

消除左递归后的 grammar：

```text
S  → T S'
S' → T S S' | T S' | ε

T  → c T'
T' → a T' | b T' | ε
```

如果仍要保留 U：

```text
S  → T S'
S' → T S S' | T S' | ε

T  → c T'
T' → a T' | b T' | ε

U  → T | c
```

---

## 为什么可以这样处理 T → T？

在代入后 `T → T a | T b | T | c`，其中 `T → T` 本身不会产生新的 terminal，也不会扩展语言，只是一个**自循环 production**。

在消除 left recursion 时，可以把它视作 `T → T ε`，最终不会给 T' 带来新的非空 alternative。因此最终 `T' → a T' | b T' | ε` 即可。

---

## Common Mistakes

→ [[99_Chapter4_自顶向下分析_易错点|Chapter 4 易错点]]

### 1. 只看到 direct left recursion，漏掉 indirect left recursion

```text
✗  只处理 T → T a | T b
✓  还要检查 T → U → T 的间接循环
```

### 2. 没有先 substitution 就直接套公式

对于 indirect left recursion，不能直接套 $A \to A\alpha \mid \beta$。要**先通过 substitution 把它变成 direct left recursion**。

### 3. 漏掉 $\varepsilon$

消除左递归时，新 nonterminal 必须有 $\varepsilon$ 分支。

```text
S' → T S S' | T S' | ε
```

如果漏掉 $\varepsilon$，就无法对应原来的 base case `S → T`。

### 4. 不同 productions 用逗号分隔

```text
✗  S → T S', S' → T S S' | T S' | ε
✓  分行写
```

### 5. 没有说明自己识别出了哪些左递归

老师强调本题要**先识别再改写**：

1. `S → S T S | S T | T` 是 S 的 general left recursion
2. `T → T a | T b | U` 是 T 的 direct/general left recursion
3. `T → U` 和 `U → T` 构成 indirect left recursion

答案里应该先说明这些，再开始改写。

---

## English Answer Patterns

> **说明存在左递归：** The grammar contains both direct and indirect left recursion.
>
> **说明 S 的左递归：** The productions S → S T S and S → S T are left-recursive, because their right-hand sides begin with S.
>
> **说明间接左递归：** There is indirect left recursion between T and U, since T can derive U and U can derive T.
>
> **说明 substitution：** To eliminate the indirect left recursion, we substitute the productions of U into the production for T.
>
> **说明最终结果：** After eliminating the left recursion, the grammar becomes: ...

---

## Reflection

这题真正考的不是简单套公式，而是**先识别 left recursion 的类型**。

普通题只需要看到 $A \to A\alpha \mid \beta$ 然后套公式。但这题要先发现 `T → U` 和 `U → T` 这种绕一圈回来的 indirect left recursion。

做这类题的顺序：

1. 先列出 direct left recursion
2. 再检查 indirect left recursion
3. 通过 substitution 把 indirect left recursion 转成 direct left recursion
4. 最后套标准消除公式

**记忆句：先识别绕路回来的递归，再套公式。**
