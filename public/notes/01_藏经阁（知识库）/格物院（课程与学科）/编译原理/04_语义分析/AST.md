---
aliases:
- 抽象语法树
- 抽象语法树 (AST)
- Abstract Syntax Tree
- AST
- 抽象语法树：去掉语法外壳后的程序骨架
created: 2026-06-11
english: Abstract Syntax Tree (AST)
source_chapter:
- 3
- 5
- 6
tags:
- 编译原理
- 语法分析
- 语义分析
- AST
title: AST
type: concept
updated: 2026-06-13
used_in_chapter:
- 3
- 5
- 6
---
# AST：去掉语法外壳后的程序骨架

> English: **Abstract Syntax Tree** (简称 **AST** )

**AST（抽象语法树）** 是源代码语法结构的一种高度精炼的树状表示。它只保留对计算有实质意义的“核心算子（操作符）”与“操作数（变量/常量）”，舍弃了括号、分号等一切不参与实际计算的语法辅助符号（语法外壳）。它是编译器前中端数据流动的核心载体。

---

## 1. 🌟 大白话通俗解释 (核心直觉)

> [!TIP]
> **行李打包的比喻**：
> 假设你准备去旅游，要打包行李：
> *   **具体语法树（CST / Parse Tree）**：代表你把所有的**衣服、包装盒、说明书、塑料袋**通通塞进箱子里。不仅臃肿，而且大部分是无用的包装（比如括号 `()`、分号 `;` 等语法“包装盒”）。
> *   **抽象语法树（AST）**：代表你**扔掉所有包装盒和塑料袋**，只把衣服本身（操作数）和洗漱用品（算符）整整齐齐地叠好放进箱子。这才是对后续旅途（代码优化与生成）真正有用的“净重”骨架。
> 
> 在 AST 中，表达式 `(3 + 4) * 5` 的括号被完全扔掉，直接长成一棵树：
> *   树根是乘号 `*`。
> *   乘号的左子树是加号 `+`，加号底下挂着 `3` 和 `4`。
>   *   右子树直接是 `5`。
> 运算的“优先级”由树的**物理结构高度**天然决定（越深越先算），根本不需要括号来维持秩序。

*   **一句话总结**：AST 是脱去括号与分号外壳、纯以“物理树形高度”体现优先级的精简程序骨架。

---

## 2. 📝 学术规范定义 (考试硬核)

### AST 树的物理数据结构 (以 C 语言实现为例)
在工业级/教学级编译器中，一个 AST 节点通常用联合体（Union）结构来表示不同的节点类型。

```c
typedef enum { ConstK, IdK, OpK, FuncK, AssignK } NodeKind;

typedef struct TreeNode {
    NodeKind nodekind;          // 节点类型：常量/变量/算子/函数/赋值
    union {
        double dval;            // 存常量的数值（如 3.14）
        char *name;             // 存变量名或函数名（如 "x", "sin"）
        int op;                 // 存运算符 Token（如 '+', '*'）
    } attr;
    struct TreeNode *child[3];  // 子节点指针数组（多叉树结构）
} nodeType;
```

---

## 3. 🛠️ Bison/Yacc 语法构建规则 (语法层面)

在 Bison 分析器中，我们通过声明 `%union` 绑定 AST 节点类型指针，在文法产生式的语义动作中**自底向上物理构造**这棵树。

### step 1: 声明值栈类型与非终结符属性
```yacc
%union {
    double      dval;   /* 常量数值 */
    char       *sval;   /* 变量/函数名称字符串 */
    nodeType   *nval;   /* 所有表达式/语句的 AST 节点指针 */
}

%token <dval> NUMBER
%token <sval> ID
%type  <nval> expr stmt
```

### step 2: 在产生式中利用综合属性建树
```yacc
%%
stmt:
    ID '=' expr
    {
        $$ = newAssignNode($1, $3); // 构造赋值节点，把 ID(左子) 和 expr(右子) 挂上去
    }
    ;

expr:
    expr '+' expr
    {
        $$ = newOpNode(OP_ADD, $1, $3); // 构造二元算子节点，挂载两个操作数
    }
  | SIN '(' expr ')'
    {
        $$ = newFuncNode("sin", $3);    // 构造单参函数节点，挂载参数树
    }
  | NUMBER
    {
        $$ = newConstNode($1);          // 叶子节点：数值常量
    }
  | ID
    {
        $$ = newIdNode($1);             // 叶子节点：变量引用
    }
  | '(' expr ')'
    {
        $$ = $2;                        // 括号直接透传，完全抛弃括号物理节点！
    }
  ;
%%
```

---

## 4. 🔄 AST 递归求值与打印函数 (逻辑层面)

构造出 AST 后，后续的语义分析、类型检查和代码生成都是通过对 AST 的 **前序/后序递归遍历** 来实现的。

### AST 打印函数 (DLR 前序遍历)
```c
void printTree(nodeType *node, int indent) {
    if (node == NULL) return;
    
    // 打印当前节点信息与缩进
    printIndent(indent);
    switch (node->nodekind) {
        case ConstK:  printf("Const: %g\n", node->attr.dval); break;
        case IdK:     printf("Var: %s\n", node->attr.name); break;
        case OpK:     printf("Op: %c\n", node->attr.op); break;
        case FuncK:   printf("Func: %s\n", node->attr.name); break;
        case AssignK: printf("Assign\n"); break;
    }
    
    // 递归打印子树
    for (int i = 0; i < 3; i++) {
        printTree(node->child[i], indent + 2);
    }
}
```

### AST 递归求值函数 (LRD 后序遍历)
```c
double eval(nodeType *node) {
    if (node == NULL) return 0.0;
    
    switch (node->nodekind) {
        case ConstK:
            return node->attr.dval; // 常量直接返回数值
        case IdK:
            return lookupSymbol(node->attr.name); // 查符号表获取变量当前值
        case OpK: {
            double left = eval(node->child[0]);  // 先算左子树
            double right = eval(node->child[1]); // 再算右子树
            if (node->attr.op == '+') return left + right;
            if (node->attr.op == '*') return left * right;
            // ... 其他算子
        }
        case FuncK: {
            double param = eval(node->child[0]); // 先算参数值
            if (strcmp(node->attr.name, "sin") == 0) return sin(param);
            // ... 其他函数
        }
        case AssignK: {
            double val = eval(node->child[1]);   // 计算右侧表达式
            updateSymbol(node->child[0]->attr.name, val); // 更新符号表
            return val;
        }
    }
    return 0.0;
}
```

---

## 5. 🔗 关联上下文 (双链图谱)

- **上级目录/章节**：[[00_Chapter6_语义分析_题型总览]]
- **前置构建理论**：[[自底向上语法分析]] / [[Bison工程落地（从设计图纸到能跑的生产线）]]
- **物理构造载体**：[[Bison值栈寻址与中置动作（传送带定位取货与临时工占位）]] — 物理值栈上的节点规约
- **属性计算对比**：[[属性文法]] / [[综合属性]] — 物理 AST 指针合成的背后数学模型
- **实验落地参考**：[[Lab2-YACC科学计算器语法分析]] — 在工程实验中的具体代码落地
