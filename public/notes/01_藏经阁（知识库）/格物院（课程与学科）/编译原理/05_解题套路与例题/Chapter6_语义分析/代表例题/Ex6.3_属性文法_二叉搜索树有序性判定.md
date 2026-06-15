---
title: Ex6.3_属性文法_二叉搜索树有序性判定
english: "Example: Attribute Grammar for BST Ordered Verification"
type: example
chapter_type: representative
aliases:
  - 二叉树有序性判定属性文法
  - BST Ordered Attribute Grammar
  - Bison BST Check
source_chapter:
  - 6
used_in_chapter:
  - 6
tags:
  - 编译原理
  - 语义分析
  - 属性文法
  - Bison语法
  - 二叉搜索树
related_concepts:
  - 属性文法
  - 综合属性
  - Bison语法
  - 二叉搜索树
  - 语义分析
related_recipes:
  - 01_语法制导翻译与属性求值
common_mistakes:
  - 99_Chapter6_语义分析_易错点
status: complete
created: 2026-06-11
---

# Ex6.3 属性文法：二叉搜索树有序性判定

## Original Question

Consider the following grammar for integer binary trees (in linearized form):

$$
btree \to ( \textbf{number} \ btree \ btree ) \mid \mathbf{nil}
$$

Write an attribute grammar to check that a binary tree is ordered, that is, that the values of the numbers of the first subtree are $\le$ the value of the current number and the values of all numbers of the second subtree are $\ge$ the value of the current number. For example, **`(2 (1 nil nil) (3 nil nil) )`** is ordered, but **`(1 (2 nil nil) (3 nil nil) )`** is not. 

You may use the following attributes: `int num`, `bool order`. Use bison syntax: `$i.num` refers to the `num` attribute of the $i$-th symbol of the production and `$$.num` refers to the `num` attribute of the production's result. Do not use global variables.

---

## 中文题意

给定二叉搜索树的线性化文法 $btree \to ( \textbf{number} \ btree \ btree ) \mid \mathbf{nil}$，使用 Bison 语法写一个属性文法来判定该二叉树是否“有序”（即符合二叉搜索树的定义：左子树的所有节点值均 $\le$ 当前节点，右子树的所有节点值均 $\ge$ 当前节点）。
要求使用 `$i.num` 和 `$$.num` 属性表示形式，禁止使用全局变量。可以使用 `num` (int) 和 `order` (bool) 两个属性。

---

## Type 题型

Bison 语法 / 自底向上语义计算 / 二叉搜索树 BST 判定 / 属性语义动作设计

---

## Related Concepts

- [[属性文法]]
- [[综合属性]] (Synthesized Attributes)
- [[Bison值栈寻址与中置动作（传送带定位取货与临时工占位）|Bison 语法]]
- [[二叉搜索树]] (BST)
- [[语法制导定义]] (SDD)

---

## Artifacts & Images / 答案与原图归档

| 我的解答 | 标准答案 |
| :---: | :---: |
| <img src="../我的答案图片/Ch6_属性文法_二叉搜索树有序性判定_我的答案_01.png" alt="我的解答" width="450"> | <img src="../原题图片/Ch6_属性文法_二叉搜索树有序性判定_标准答案_01.png" alt="标准答案" width="450"> |

---

## ⚠️ 官方课件勘误与考场避坑细节

仔细对比 **学生作答手稿（图上）** 与 **官方课件标准答案（图下）** ，可以发现官方课件的语义规则中存在多处 **严重低级错误（Bug）** 。在考场上如果直接照抄课件写法将会被扣除全部步骤分。以下是详细的学术勘误与深度复盘：

### 1. 官方课件的低级错误（勘误表）
*   **错误一：Bison 动作中的语义值索引越界（最致命）**：
    *   *课件原写*：`$1.num>= $4.largest & $1.num<= $3.smallest`
    *   *问题剖析*：产生式为 `btree : '(' number btree1 btree2 ')'`。按照 Bison 规范，右部符号的 1-indexed 索引为：`$1` 对应 `'('`，`$2` 对应 `number`，`$3` 对应 `btree1`，`$4` 对应 `btree2`，`$5` 对应 `')'`。
        `$1` 代表终结符 `'('`，在词法上它没有携带任何数值属性，因此引用 `$1.num` 会直接导致编译报错或运行时指针越界！
    *   *正确写法*：应当全部改为 **`$2.num`** （引用根节点的数值）。
*   **错误二：左右子树极值比较逻辑“彻底颠倒”**：
    *   *课件原写*：判定条件写为了 `$1.num >= $4.largest`（根节点值 $\ge$ 右子树最大值）以及 `$1.num <= $3.smallest`（根节点值 $\le$ 左子树最小值）。
    *   *问题剖析*：根据 BST 的有序定义，根节点值应当 **大于等于左子树的最大值** （即 `$3.largest`），且根节点值应当 **小于等于右子树的最小值** （即 `$4.smallest`）。课件完全写反了，会导致判定逻辑彻底失效（例如反例无法被滤除，正常树被误判）。
    *   *正确写法*：
        *   表格形式：`number.num >= btree1.largest && number.num <= btree2.smallest`
        *   Bison 形式：`$2.num >= $3.largest && $2.num <= $4.smallest`
*   **错误三：极值更新计算错字**：
    *   *课件原写*：`$$.smallest = min ( $2.num, $3.largest);`
    *   *问题剖析*：更新整棵树的最小值（smallest）时，应当在根节点与 **左子树的极小值（$3.smallest）** 之间求取最小值。课件写成了 `$3.largest`（左子树最大值），属于明显的拼写笔误。
    *   *正确写法*：`$$.smallest = min($2.num, $3.smallest);`

### 2. 学生手稿答案优势与失分点
*   **手稿的正确性优势**：
    *   学生手写的极值传递和判定公式完全避开了官方答案中“左右颠倒”的逻辑错误。使用 `btree1.max <= number.val && btree2.min >= number.val`，在 **数学逻辑上完全正确** 。
    *   对于 `nil` 节点的极值哨兵，手稿设为 `btree.min = +inf` 和 `btree.max = -inf`，这使得在非空节点合并极值时，可以直接使用 `btree.min = min(btree1.min, number.val)`，极其优雅。
*   **手稿的致命失分点（漏写属性传递）**：
    *   手稿中在 `btree -> ( number btree1 btree2 )` 产生式下， **漏写了 `btree.min` 和 `btree.max` 的更新方程** ！
    *   *后果*：如果不写这两个属性的更新方程，极值属性将无法向上传递给父节点，导致更高层的祖先节点在归约时无法判定，在考场上属于严重的步骤缺失，会被扣除大部分步骤分。

---

## Standard Solution 标准答案

### 1. 属性设计 (Attribute Design)

非终结符 `btree` 关联如下综合属性（Synthesized Attributes）：
*   `bool order`：表示当前子树是否满足二叉搜索树（BST）的有序性要求。
*   `int num`（或 `val`）：存储当前根节点的值。
*   `int smallest`（或 `min`）：存储当前子树中的所有节点数值的极小值。
*   `int largest`（或 `max`）：存储当前子树中的所有节点数值的极大值。

对于空树（`nil`）：
*   `order = true`
*   `smallest = +infinity` (在代码中使用 `INT_MAX`)
*   `largest = -infinity` (在代码中使用 `INT_MIN`)

---

### 2. 语法制导定义 (SDD) 表格形式

| 产生式 (Production) | 语义规则 (Semantic Rules) |
| :--- | :--- |
| **`btree → ( number btree_1 btree_2 )`** | $btree.largest = \max(btree_2.largest, number.num)$<br>$btree.smallest = \min(btree_1.smallest, number.num)$<br>$btree.order = btree_1.order \land btree_2.order \land (number.num \ge btree_1.largest) \land (number.num \le btree_2.smallest)$<br>$btree.num = number.num$ |
| **`btree → nil`** | $btree.largest = -\infty$<br>$btree.smallest = +\infty$<br>$btree.order = \text{true}$<br>$btree.num = -1$ |

---

### 3. Bison 表现形式

使用 Bison 语法书写动作代码如下（已完全修正官方课件的索引与逻辑 Bug）：

```yacc
btree: '(' number btree btree ')'
    {
        /* 
           产生式右侧符号位置索引说明：
           $1: '('
           $2: number (对应 token 的 num 属性值)
           $3: btree1 (左子树)
           $4: btree2 (右子树)
           $5: ')'
        */
        
        // 1. 判断是否有序
        $$.order = $3.order && $4.order 
                 && ($2.num >= $3.largest) 
                 && ($2.num <= $4.smallest);
        
        // 2. 更新当前树的最大值与最小值
        $$.largest = max($2.num, $4.largest);
        $$.smallest = min($2.num, $3.smallest);
        
        // 3. 记录当前根节点值
        $$.num = $2.num;
    }
    | nil
    {
        $$.order = true;
        $$.largest = INT_MIN; // 极大值设为负无穷
        $$.smallest = INT_MAX; // 极小值设为正无穷
        $$.num = -1;
    }
;
```

---

## 避坑指南 与 考前易错点

> [!CAUTION]
> **切记维护属性链条的完整性**：
> 构造二叉搜索树判定等涉及树形极值计算的属性文法时，千万不要只写 `btree.order` 的判定公式，而 **必须完整写出极值属性向上传递的规则** （如 `$$.largest = ...`）。如果省略极值更新，上层节点无法获取子树的真实上下界，导致语义求值断裂，这是最典型的手写失分项。
