---
title: 99_Chapter6_语义分析_易错点
english: Chapter 6 Semantic Analysis Common Mistakes
type: mistake-index
aliases:
  - Chapter 6 Semantic Analysis Common Mistakes
  - Chapter 6 语义分析易错点
  - 属性文法易错点
  - Chapter6_语义分析_易错点
source_chapter:
  - 6
used_in_chapter:
  - 6
tags:
  - 编译原理
  - 语义分析
  - 易错点
status: complete
created: 2026-06-13
---
# Chapter 6 语义分析易错点

> 来源：老师课堂点评 + 作业批改。考前必看。
>
> 记忆句：**属性文法是等式系统，不是代码段；传递链断了，整棵树都废了。**

---

## 🔴 致命错误

### 1. 语义规则等式中混用赋值号

**错误写法：**
```text
E₁ → E₂ + T      E₁.postfix := E₂.postfix || T.postfix || "+"
E₁ → E₂ + T      E₁.postfix ← E₂.postfix || T.postfix || "+"
```

**问题：** 语法制导定义（SDD）里的语义规则是**等式（Semantic Equations）**，不是程序代码。必须使用**等号 `=`**，严禁使用赋值号 `:=`、`<-` 或 `=` 与 `:=` 混用。

**推荐写法：**
```text
E₁ → E₂ + T      E₁.postfix = E₂.postfix || T.postfix || "+"
```

> **English Pattern:** Semantic rules in an SDD are equations, not assignment statements. Use the equals sign `=` rather than assignment operators like `:=` or `<-`.

---

### 2. Bison/Yacc 语义动作中位置索引越界（移位错误）

**错误产生式与动作：**
对产生式 `btree: '(' number btree btree ')'`
```yacc
// 错误写法：
$$.order = $3.order && $4.order && ($1.num >= $3.largest);
```

**问题：** 在 Bison 中，右部的符号索引是从左往右数（1-indexed）。`$1` 对应的是左括号 `'('`，它没有 `num` 属性。数字 `number` 是第 **2** 个符号，引用它必须用 **`$2`**。直接写 `$1` 会导致编译器报语法错误或运行时指针越界。

**推荐写法：**
```yacc
$$.order = $3.order && $4.order && ($2.num >= $3.largest);
```

> **English Pattern:** In Bison/Yacc semantic actions, ensure that you count the symbols in the production's right-hand side correctly (1-indexed). Do not refer to non-valued terminals (like parentheses or commas) as if they carry attributes.

---

### 3. 极值与状态属性的“向上传递链”中断

**错误描述：**
设计二叉搜索树判定文法时，只写了判定 `btree.order` 的语义规则，而**漏掉了**计算和传递子树极值 `btree.largest` 和 `btree.smallest` 的规则。

**问题：** 属性计算是自底向上或自顶向下流动的。如果你不把当前子树的极值传上去，父节点在归约时就拿不到子树的信息，判定逻辑在更高层就会断裂。这是手写大题最常见的“半拉子工程”，会被扣除大部分步骤分。

**推荐做法：**
每一个产生式里，**所有声明的属性都必须有对应的语义等式**。
```text
btree → ( number btree₁ btree₂ )
  btree.largest = max(btree₂.largest, number.num)
  btree.smallest = min(btree₁.smallest, number.num)
  btree.order = btree₁.order ∧ btree₂.order ∧ (number.num ≥ btree₁.largest) ∧ (number.num ≤ btree₂.smallest)
```

---

## 🟡 高频扣分点

### 4. L-属性文法的继承属性依赖了“右侧兄弟”或“父节点综合属性”

**错误定义：**
```text
A → B C      B.inh = C.val
A → B C      B.inh = A.val (其中 val 是 A 的综合属性)
```

**问题：** 
1. L-属性文法中，继承属性**绝对不能依赖其右侧兄弟**的属性（遍历到 $B$ 时 $C$ 还没有访问，`C.val` 是未定义的）。
2. **绝对不能依赖父节点的综合属性**。因为父节点的综合属性必须等所有子节点算完才能算，如果子节点的继承属性又去等父节点的综合，就会形成环路死锁。

**推荐写法：**
L-属性的继承属性只能依赖：
1. 父节点的**继承属性**；
2. **左侧兄弟**的任何属性。

---

### 5. 依赖图箭头方向画反

**错误画法：**
若语义规则为 $B.v = B.u$，画为：
$$
B.v \longrightarrow B.u
$$

**问题：** 依赖图中的箭头是**求值依赖方向**（从输入/自变量指向输出/因变量）。这里计算 $B.v$ 需要先知道 $B.u$，所以应当是从 $B.u$ 指向 $B.v$。

**推荐画法：**
$$
B.u \longrightarrow B.v
$$

---

### 6. 空树 (nil/ε) 极值哨兵设计颠倒

**错误写法：**
```text
btree → nil
  btree.largest = +infinity
  btree.smallest = -infinity
```

**问题：** 
如果把空树的最大值（largest）设为正无穷，那么当把空树和任何一个真实节点 $x$ 放在一起求最大值时（`max(x, largest)`），正无穷会无脑胜出，导致整棵树的最大值变成正无穷。这完全违背了求极值的逻辑。

**推荐写法：**
*   **最大值 (largest/max)**：空树初值设为 **$-\infty$** (`INT_MIN`)。
*   **最小值 (smallest/min)**：空树初值设为 **$+\infty$** (`INT_MAX`)。

---

## 🟢 英文答题检查清单

- [ ] 语义等式是否全部使用的是 `=`，没有用 `:=` 或 `<-`？
- [ ] Bison 语法中的位置索引（如 `$2.num`）是否严格对应了右侧的值属性符号？
- [ ] 极值计算中，是否把所有子树极值向上传递的规则写全了，有没有中断？
- [ ] 判断 L-属性文法时，是否确认了没有任何子节点继承属性依赖了右侧兄弟的属性？
- [ ] 依赖图的箭头是否全部是由“因”指向“果”（从自变量指向因变量）？
- [ ] 空节点的极值哨兵，最小值设为 `INT_MAX`，最大值设为 `INT_MIN` 了吗？
- [ ] 遇到有环图，是否使用了“编译拓扑失败” + “代数联立求解”的双轨制完美回答？

---

## 🧠 最小复习口诀

- **语义等式**：用等号，别写代码赋值号
- **Bison 索引**：数清位置，括号也占位
- **极值传递**：层层合成，别漏写传给上层
- **空树哨兵**：最大设负极，最小设正极
- **L-属性**：只往左看，别看右边和父综合
- **依赖箭头**：前因导后果，别把箭头画反了
- **有环大题**：理论求值败，代数联立可解之
