---
title: 99_Chapter4_自顶向下分析_易错点
english: Chapter 4 Top-Down Parsing Common Mistakes
type: mistake-index
aliases:
  - Chapter 4 Top-Down Parsing Common Mistakes
  - Chapter 4 自顶向下分析易错点
  - Chapter 4 LL(1) 易错点
  - LL(1) Common Mistakes
  - LL1易错点
  - Chapter4_LL1_易错点

---
# Chapter 4 自顶向下分析易错点

> 来源：老师课堂点评 + 作业批改。考前必看。
>
> 记忆句：**形式系统里，省一笔可能就从 grammar 变涂鸦了。**

---

## 🔴 致命错误

### 1. 不同产生式不要用逗号分隔

**错误写法：**

```text
S → T S', S' → T S S' | T S' | ε
```

**问题：** 逗号 `,` 不能作为不同产生式之间的分隔符，因为逗号本身也可能是 grammar 中的 terminal token。用逗号分隔会产生歧义：读者无法判断逗号是分隔符还是真正的 terminal。

**推荐写法：**

```text
S  → T S'
S' → T S S' | T S' | ε
```

或者：

```text
S  → T S'
S' → T S S'
   | T S'
   | ε
```

> **English Pattern:** Do not use commas to separate different productions, because a comma may itself be a terminal symbol in the grammar. Each production should be written clearly on a separate line, and alternatives should be separated using `|`.

---

### 2. Parser trace 每行只能有一个 Action

> **一列不止执行一个 Action 是严重概念错误。**

每一行只能做一个 atomic action：

- apply one production
- match one terminal
- accept
- error

不能把多个 action 合并到一行。例如不能一行同时做 `exp → term exp'` 然后 `term → factor term'`，必须拆成两行。

> **English Pattern:** Each row in a parsing trace should contain exactly one atomic action.

---

### 3. Parsing table 应该有 `$` 列，不应该有 $\varepsilon$ 列

```text
✗  表头：id  (  )  +  *  ε  $
✓  表头：id  (  )  +  *  $
```

$\varepsilon$ 不是 input symbol，parser 不会从 input 中读到 $\varepsilon$。LL(1) parsing table 的列只应该是 **terminal symbols 和 end marker `$`**。

> **English Pattern:** The columns of an LL(1) parsing table are terminal symbols and the end marker `$`. There should not be a column for $\varepsilon$, because $\varepsilon$ is not an input symbol.

---

### 4. `A → ε` 要根据 FOLLOW(A) 填入 parsing table

如果有 production $A \to \varepsilon$，应该填入 $M[A, b]$，其中 $b \in FOLLOW(A)$。

**示例：** 若 $FOLLOW(lexp\text{-}seq') = \{ ) \}$，则只填 $M[lexp\text{-}seq',\ )] = lexp\text{-}seq' \to \varepsilon$。

> **不能随便填到 `$` 列。** 只有当 `$` $\in FOLLOW(A)$ 时，才可以填到 `$` 列。

> **English Pattern:** If $A \to \varepsilon$, place this production in $M[A, b]$ for every $b \in FOLLOW(A)$. Do not place an $\varepsilon$-production in the `$` column unless `$` is in the FOLLOW set.

---

### 5. FOLLOW 集合要写成集合形式

```text
✗  FOLLOW(lexp-seq') = )
✓  FOLLOW(lexp-seq') = { ) }
```

FOLLOW 是一个 **set**，即使只有一个元素也要用 `{ }`。

> **English Pattern:** FIRST and FOLLOW are sets. Even if a set contains only one symbol, it should still be written using set notation.

---

## 🟡 高频扣分点

### 6. 证明不是 LL(1) 必须指出具体冲突格子

**不完整答案：** 只写一张 parsing table，然后说 "So the grammar is not LL(1)."

**正确答案结构：**

1. FIRST / FOLLOW 如何得到
2. Parsing table 如何构造
3. Conflict 出现在哪个 entry
4. 为什么 conflict 说明 grammar is not LL(1)

**示例句式：**

> In the entry $M[A, a]$, there are two productions: $A \to aAa$ and $A \to \varepsilon$. Therefore, the LL(1) parsing table contains a conflict. Since each entry must contain at most one production, the grammar is not LL(1).

**记忆句：表格只是证据，分析才是答案。**

> **English Pattern:** The grammar is not LL(1) because the LL(1) parsing table contains a conflict. In the entry $M[A, a]$, there is more than one production. This violates the LL(1) condition.

---

### 7. Left factoring ≠ Eliminating left recursion

| 操作 | 解决的问题 | 适用场景 |
|------|-----------|---------|
| Left factoring | 共同前缀 | $A \to \alpha\beta_1 \mid \alpha\beta_2$ |
| Eliminate left recursion | 左递归 | $A \to A\alpha \mid \beta$ |

> **English Pattern:** Left factoring is used when two or more productions share a common prefix. Left recursion elimination is used when a nonterminal can derive a sentential form beginning with itself.

---

### 8. 间接左递归要先 substitution 转成直接左递归

检查左递归时，不仅要看 **immediate left recursion**（`A → A...`），还要检查 **indirect left recursion**（通过其他非终结符绕回来的情况）。

**典型间接左递归：**

```text
S → Aa | b
A → Sd | c     ← S → Aa → Sda，间接左递归！
```

**处理方法：** 先把一个 nonterminal 的 productions 代入另一个，转成直接左递归，再套标准消除公式。

> **English Pattern:** To eliminate indirect left recursion, substitute the productions of one nonterminal into the other so that the grammar is transformed into an equivalent grammar with direct left recursion. Then apply the standard left recursion elimination rule.

---

### 9. 提取左因子漏掉 ε 分支（临界漏洞）

**典型错解：** 对 $A \to a \mid a b$ 提取左因子时：
```text
A  → a A'
A' → b
```

**正解分析：** 原产生式中包含分支 $a$（即前缀本身）。当把 $a$ 作为共同前缀提出来后，该分支对应的剩余部分为 $\varepsilon$。因此新符号 $A'$ 的产生式中**绝对不能漏掉空产生式分支**。

**推荐写法：**
```text
A  → a A'
A' → b | ε
```

---

### 10. 提取左因子不彻底（遗漏嵌套前缀）

**典型错误：** 提取完一次左因子后，觉得工作已经结束，却没有检查新引入的非终结符 $A'$ 是否仍存在共同前缀。
例如：对于 $A \to a b c \mid a b d \mid e$：
1. 提 $a$ 得到：$A \to a A', A' \to b c \mid b d$。
2. 错误地停留在此处。因为 $A'$ 的两个候选分支仍共享前缀 $b$。

**推荐做法：** 必须**迭代检查**。对新引入的非终结符 $A'$ 继续提取共同前缀 $b$：
```text
A   → a A'
A'  → b A''
A'' → c | d
```

---

### 11. ⚙️ Obsidian Mermaid 语法避坑：避开数字列表前缀

在用 Obsidian 编写 Mermaid 流程图时，**绝对不要让节点文本以 `1. `、`2. ` 等“数字 + 英文句点 + 空格”开头**。
例如：`Start --> Node["1. 检查文法"]` 会导致 Obsidian 的 Markdown 解析器强行将其识别为 Ordered List Block，从而使得 Mermaid 渲染引擎崩溃并报错 **`Unsupported markdown: list`**。

**避坑方案：** 改用 `步骤一：`、`[1]`、`①` 或 `1)` 作为前缀。

---

## 🟢 英文答题检查清单

- [ ] Grammar 产生式是否一行一条，没有用逗号分隔？
- [ ] FIRST/FOLLOW 计算过程是否完整写出？
- [ ] FOLLOW 是否用集合形式 `{ }`？
- [ ] Parsing table 是否有 `$` 列、没有 $\varepsilon$ 列？
- [ ] $\varepsilon$-production 是否填在 FOLLOW 对应的列里？
- [ ] Parser trace 每行是否只有一个 action？
- [ ] 证明 not LL(1) 时是否指出了具体冲突 entry？
- [ ] 消除左递归时是否检查了间接左递归？
- [ ] 提取左因子时是否遗漏了 $\varepsilon$ 选项？
- [ ] 提取左因子是否彻底（检查了嵌套的共同前缀）？

---

## 🧠 最小复习口诀

- **表头**：terminal + `$`，没有 $\varepsilon$
- **$\varepsilon$ 产生式**：看 FOLLOW
- **Trace**：一行一个 action
- **Not LL(1)**：指出冲突格子
- **Grammar**：一条产生式一行，别用逗号糊
- **左递归**：先查 direct，再查 indirect
- **左因子**：别漏 $\varepsilon$，嵌套提取要彻底
- **Mermaid 避坑**：节点别用 `1. ` 开头，避开 list 报错
