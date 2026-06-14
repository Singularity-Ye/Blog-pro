---
aliases:
- 给语法树注入灵魂
- AST递归求值
- 符号表存取
- 符号表存取与AST递归求值
- 给语法树注入灵魂：符号表存取与AST递归求值
created: 2026-06-13
english: Symbol Table and Recursive AST Evaluation
source_chapter:
- 6
tags:
- 编译原理
- 语义分析
- AST
- 符号表
- 递归求值
- 求值器
title: 给语法树注入灵魂（符号表存取与AST递归求值）
type: concept
updated: 2026-06-13
used_in_chapter:
- 6
---
# 给语法树注入灵魂：符号表存取与AST递归求值

## 1. 🌟 大白话通俗解释 (核心直觉)

> [!NOTE] **电路通电与备忘录记事本比喻**
> 当我们把 AST 语法树搭建完毕，它目前只是个空骨架。
> 接下来，我们需要给它**通电（开始递归遍历求值）**，并带上一本**“记事本”（符号表 Symbol Table）**：
> 1. **通电（ast_eval 递归）**：电流从树根进入，发现是个“加法”按钮。它就顺着左导线流向左子节点，算出了一个数；再顺着右导线流向右子节点，算出了另一个数。最后，加法按钮把两股电流（数值）合在一起相加，返还给上级。
> 2. **查记事本（符号表存取）**：
>    - 遇到赋值语句（如 `x = 5`）：电流在记事本（符号表）上大笔一画，记下：“变量名 `x` 对应数据 `5`”。
>    - 遇到变量引用（如 `y = x + 2`）：电流走到 `x` 的分支时，由于 `x` 只是个字母，电流无法算值，必须翻开记事本查找：“哦，刚才存的 `x` 是 `5`！”于是查出数值，继续运算。
> 3. **操作台内存（Memory 指令）**：计算器的 `MC`/`MR`/`M+` 指令，就是操作台旁一个**专门的寄存器（全局单例变量）**。它不归记事本（符号表）管，而是一个独立的“大数字收纳盒”。

---

## 2. 📝 学术规范定义 (考试硬核)

### AST 递归属性求值与符号表作用域
对于语法树节点，通过实现深度优先的递归遍历算法（即后序遍历树），自底向上完成属性的合成求值。

```
                    [NODE_ASSIGN (x = 3 + 4)]
                            /         \
                 [NODE_IDENTIFIER]   [NODE_BINARY (+)]  --->  评估出值 7.0 
                      name="x"           /        \           并写入符号表
                                      ConstK     ConstK
                                      val=3.0    val=4.0
```

### 符号表 (Symbol Table) 数据结构规范
符号表通常通过哈希表（Hash Table）或嵌套的链表结构实现，以支持**作用域的分层嵌套**（Scope Stack）：
```c
typedef struct Symbol {
    char *name;
    double value;
    struct Symbol *next;
} Symbol;

Symbol *symbol_table = NULL; // 全局符号表链表头

void insert_symbol(const char *name, double val);
double lookup_symbol(const char *name);
```

---

## 3. 🎯 实验与解题痛点 (拿分与排坑关键)

> [!CAUTION] **实验大坑：求值时未定义变量 (Undefined Variable) 的崩溃**
> **实验故障场景**：当输入一个未曾赋值的变量（比如直接计算 `a + 5`，但 `a` 从未被赋值），程序直接 SegFault 段错误或输出随机垃圾值。
> 
> **物理根源**：查找符号表函数 `lookup` 在找不到变量时返回了 `NULL`，而调用者没有做空指针校验，直接解引用 `lookup(name)->value`。
> 
> **排坑解法模板**：
> 1. `lookup` 必须提供错误返回标记。
> 2. 在 AST 的求值函数 `ast_eval` 中，针对 `NODE_IDENTIFIER` 编写严格校验：
>    ```c
>    if (node->kind == NODE_IDENTIFIER) {
>        Symbol *sym = lookup(node->name);
>        if (sym == NULL) {
>            yyerror("Error: Variable undefined!");
>            return 0.0; // 或者触发异常恢复
>        }
>        return sym->value;
>    }
>    ```

---

## 4. 🔗 关联上下文 (双链图谱)

- **上级目录/实验**：[[Lab2-YACC科学计算器语法分析]]
- **孪生/对比概念**：[[用产生式搭乐高积木（自底向上的AST物理构造）]]
- **前置依赖**：[[依赖图与属性求值顺序（谁依赖谁、谁先算的排队图）]] / [[静态语义]]
