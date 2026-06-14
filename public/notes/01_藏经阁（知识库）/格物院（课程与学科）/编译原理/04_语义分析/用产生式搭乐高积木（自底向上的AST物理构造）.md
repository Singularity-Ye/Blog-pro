---
aliases:
- 用产生式搭乐高积木
- AST的自底向上构造
- Bison语义动作
- 自底向上的AST物理构造
- 用产生式搭乐高积木：自底向上的AST物理构造
created: 2026-06-13
english: SDT and Bottom-Up AST Construction in Bison
source_chapter:
- 5
- 6
tags:
- 编译原理
- 语法分析
- 语义分析
- AST
- SDT
- 综合属性
title: 用产生式搭乐高积木（自底向上的AST物理构造）
type: concept
updated: 2026-06-13
used_in_chapter:
- 5
- 6
---
# 用产生式搭乐高积木：自底向上的AST物理构造

## 1. 🌟 大白话通俗解释 (核心直觉)

> [!NOTE] **乐高拼装流水线比喻**
> 想象我们要拼装一架复杂的乐高航天飞机（一棵完整的 AST 语法树）。
> 自底向上的语法归约，就是**在装配流水线上不断小拼大**的过程：
> 1. **出厂小砖块**：Flex 送来各种贴好标的散砖（比如数字 `3.14`，变量 `x`），我们把它们当作基础小零件。
> 2. **流水线拼装**：
>    - 看到 `x`（零件），我们立刻把它装上一个变量插座。
>    - 看到 `E1` (飞机左翼) 和 `E2` (飞机右翼) 以及一个连接件 `+`（加号），装配工就会拿过它们，用一个**二元连接器**（调用 `newOpNode`）把左右两半牢牢卡在加号上。
>    - 拼装好的大组件（归约返回的 `$$` 树节点）再次被放回值栈传送带上，等待上一级更宏观的拼装规则（比如 `= 赋值` 或整个语句）。
> 3. **最终成品**：当整个剧本读完，最后一次归约发生时，整架航天飞机拼装完毕，我们拿到了树根节点的指针。

---

## 2. 📝 学术规范定义 (考试硬核)

### 语法制导定义 (SDD) 构建抽象语法树
自底向上分析器利用 **综合属性（Synthesized Attributes）** 的自底向上求值特征，同步物理构造抽象语法树。

```
     理论上的 SDD 属性计算公式                      Bison 工程物理代码实现
  E1.node = ast_binary("+", E2.node, T.node)  <==>  expr : expr '+' expr { $$ = ast_binary("+", $1, $3); }
```

### 多态 C 语言 AST 节点数据结构设计
为了用统一的 C 类型容纳不同的文法成分，通常在 C 中定义一个包含 **NodeKind 枚举** 和 **多功能复合字段** 的多态结构体：
```c
typedef enum NodeKind {
    NODE_NUMBER,      // 常量节点
    NODE_IDENTIFIER,  // 变量节点
    NODE_BINARY       // 双目运算节点
} NodeKind;

typedef struct Node {
    NodeKind kind;
    double value;
    char *name;
    struct Node *left;
    struct Node *right;
} Node;
```

---

## 3. 🎯 实验与解题痛点 (拿分与排坑关键)

> [!CAUTION] **考试与实验避坑：中途语义动作导致的状态分裂危机**
> **学术陷阱**：在 Bison 规则中间插入语义动作。
> ```yacc
> expr : expr { printf("Middle Action!\n"); } PLUS expr { $$ = ast_binary("+", $1, $4); }
> ```
> **物理过程剖析**：
> LALR(1) 状态机只允许在**产生式圆点到达最右侧**时进行归约并执行动作。为了在中间执行动作，Bison 会在幕后重写文法，插入一个看不见的 **$\epsilon$-产生式**：
> $$\text{expr} \to \text{expr} \; M \; \text{PLUS} \; \text{expr}$$
> $$M \to \varepsilon \quad \{ \text{printf("Middle Action!\\n");} \}$$
> 
> **严重后果**：这无中生有地引入了非终结符 $M$ 和 $\epsilon$ 归约，导致原本能合并的 LALR(1) 同心项状态发生**分裂**，极易引入原本并不存在的 **移进-归约冲突**！
> **金牌排坑法则**：**除非绝对必要，绝对不要在文法中间写任何 `{ }` 动作**，一律只写在最右端。

---

## 4. 🔗 关联上下文 (双链图谱)

- **上级目录/实验**：[[Lab2-YACC科学计算器语法分析]]
- **孪生/对比概念**：[[给语法树注入灵魂（符号表存取与AST递归求值）]]（介绍构造完树后如何让它运作）
- **前置依赖**：[[综合属性]] / [[AST|抽象语法树]]
