---
aliases:
- Bison值栈寻址与中置动作（传送带定位取货与临时工占位）
- Bison语法
- Bison 语法
- Bison 与 Yacc
- Bison
- 传送带定位取货与临时工占位
- Bison值栈寻址与中置动作：传送带定位取货与临时工占位
created: 2026-06-11
english: Bison Syntax & Parsing
source_chapter:
- 6
tags:
- 编译原理
- 语法分析
- 语义分析
- Bison
- Yacc
title: Bison值栈寻址与中置动作（传送带定位取货与临时工占位）
type: concept
used_in_chapter:
- 6
---
# Bison值栈寻址与中置动作：传送带定位取货与临时工占位

> English: **Bison Syntax & Parser Generator**

**Bison** 是 GNU 计划开发的、兼容 Yacc 的 **语法分析器生成器** （Parser Generator）。它基于 **LALR(1)** 分析算法，读取上下文无关文法（CFG）规格说明文件，自动生成用 C/C++ 编写的语法分析器函数 `yyparse()`。

---

## 1. 🌟 大白话通俗解释 (核心直觉)

> [!TIP]
> **双轨道传送带与倒数拿箱子的比喻**：
> Bison 就像是一个自动化的**流水线工厂车间**。读这张图时，先记住用户在 `.y` 文件里真正会写的是 **`$1`、`$2`、`$3` 和 `$$`**；`yyvsp` / `yyval` 是 Bison 把这些写法翻译成 C 代码后使用的内部变量。
> *   **双轨道传送带**：工厂里有两条平行移动的传送带。第一条叫“状态栈”，上面放着当前装配到哪一步的状态号；第二条叫“属性值栈”，上面并排放着对应的属性值，比如数字、字符串、AST 指针或集合指针。
> *   **用户视角公式**：对产生式
>     $$A \to X_1\ X_2\ \dots\ X_n$$
>     Bison 动作里的 `$i` 表示右部第 `i` 个符号 `X_i` 的属性，`$$` 表示左部符号 `A` 的归约结果属性。
> *   **生成代码公式**：归约时属性栈指针 `yyvsp` 指向右部最后一个符号 `X_n`，所以 Bison 会把用户写法翻译为：
>     $$\$i \Longleftrightarrow yyvsp[i-n], \qquad \$\$ \Longleftrightarrow yyval$$
> *   **具体例子**：若产生式是 `S : A B C { $$ = f($1, $3); }`，右部长度 `n = 3`，那么：
>     *   `$1 = yyvsp[1-3] = yyvsp[-2]`，对应 `A` 的属性。
>     *   `$2 = yyvsp[2-3] = yyvsp[-1]`，对应 `B` 的属性。
>     *   `$3 = yyvsp[3-3] = yyvsp[0]`，对应 `C` 的属性。
>     *   `$$ = yyval`，对应归约出来的新 `S` 的属性。

*   **一句话总结**：Bison 就是用两个平行栈进行移进-归约，并且翻译语义动作时，通过“倒数偏移”来精准定位获取变量属性。

---

## 2. 📝 学术规范定义 (考试硬核)

### 工具规格工作流
Bison 规格说明文件 `.y` 经 Bison 编译生成 LALR(1) 分析表及 C 语言分析器源码：

```mermaid
flowchart LR
    Spec[".y 规格说明文件<br/>(规则 + C动作)"] --> Bison["Bison 编译器"]
    Bison --> Source["y.tab.c / y.tab.h<br/>(LALR 分析表 + C源文件)"]
    Lexer["yylex()<br/>(词法分析器)"] --> Compiler["C 编译器"]
    Source --> Compiler
    Compiler --> Parser["yyparse()<br/>(可运行语法分析器)"]
```

### 三段式结构规格文件
Bison 规范说明文件以双百分号 `%%` 分隔为三部分：
```yacc
%{
/* 第一部分：C 声明与全局类型配置 (Definitions) */
#include <stdio.h>
#include <limits.h>
%}

%union {
    int ival;
    char *sval;
}
%token <ival> NUMBER
%type <ival> expr

%left '+' '-'
%left '*' '/'

%%
/* 第二部分：文法产生式规则与语义动作 (Rules) */
program: expr            { printf("Result: %d\n", $1); }
       ;
expr: expr '+' expr      { $$ = $1 + $3; }
    | NUMBER             { $$ = $1; }
    ;

%%
/* 第三部分：辅助 C 用户函数 (Routines) */
int yylex(void) {
    // 词法分析，由 yyparse 调用以获取下一个 Token
}
void yyerror(const char *s) {
    fprintf(stderr, "Error: %s\n", s);
}
```

#### 集合型属性的 `%union` 写法
当语义动作要携带“变量集合”这类复杂属性时，不把整个集合塞进值栈，而是在值栈里放一个指针：

```yacc
%{
typedef struct Set Set;
%}

%union {
    char *sval;  /* var.sname */
    int  ival;   /* int_const.val */
    Set *set;    /* expr.ref / stmt.in / stmt.out */
}

%token <sval> VAR
%token <ival> INT_CONST
%type  <set>  expr stmt
```

对应的动作只需要把 `$1`、`$3` 当作 `Set *` 来做集合运算：

```yacc
expr: expr '+' expr   { $$ = set_union($1, $3); }
    | VAR             { $$ = set_singleton($1); }
    | INT_CONST       { $$ = set_empty(); }
    ;
```

> [!TIP]
> Bison 值栈只负责搬运属性值本身；如果属性值很大（集合、AST 节点、符号表环境），工程上通常搬运指针，真正的数据结构由辅助 C 函数管理。

### 属性栈物理模型与寻址映射
对于产生式：$A \to X_1 X_2 \dots X_n$
在生成的 C 代码中，Bison 通过相对值栈指针 `yyvsp` 进行相对寻址：
*   **`$$`** $\to$ 局部归约结果临时变量 **`yyval`**
*   **`$i`** $\to$ **`yyvsp[i - n]`**（其中 $1 \le i \le n$）

对于表达式 `expr: expr '+' expr`（右侧共 3 个符号，$n=3$），Bison 编译生成的 C 归约代码为：
```c
case 12: // 语义动作执行
  yyval = yyvsp[-2] + yyvsp[0]; // 即 $$ = $1 + $3 (忽略了运算符 '+')
  break;
```

#### 归约时的双栈物理演变示意图
```text
1. 归约前 (执行 C 动作前)：
   状态栈指针 yyssp 指向 s_3，值栈指针 yyvsp 指向 v_expr2。
   
   状态栈 (State Stack): [ ..., s_prev,  s_expr1,  s_plus,   s_expr2 ] ← yyssp (栈顶)
   属性栈 (Value Stack): [ ..., v_prev,  v_expr1,  v_plus,   v_expr2 ] ← yyvsp (栈顶)
                                            │         │         │
                                            │         │         └─ yyvsp[0]  (即 $3)
                                            │         └─────────── yyvsp[-1] (即 $2)
                                            └───────────────────── yyvsp[-2] (即 $1)
                                            
   【动作】：执行 yyval = yyvsp[-2] + yyvsp[0]; (计算 v_expr1 + v_expr2)

2. 归约中 (双栈弹出 3 个符号)：
   状态栈与属性栈同时向下收缩 3 格。
   
   状态栈 (State Stack): [ ..., s_prev ] ← yyssp 新位置
   属性栈 (Value Stack): [ ..., v_prev ] ← yyvsp 新位置

3. 归约后 (压入新状态与结果)：
   - 将计算好的新值 yyval 压入属性栈。
   - 查 GOTO 跳转表，将新状态 s_new 压入状态栈。
   
   状态栈 (State Stack): [ ..., s_prev,  s_new ]   ← yyssp (栈顶)
   属性栈 (Value Stack): [ ..., v_prev,  yyval ]   ← yyvsp (栈顶)
```

---

## 3. 🎯 应试痛点与解题模板 (拿分关键)

### 痛点一：中置动作（Mid-rule Actions）的物理偏移计算
*   **考场场景**：在 L-属性计算中，有时需要在产生式中间插入动作，例如：
    `A : B { /* 动作 1 */ } C { /* 动作 2 */ };`
*   **物理翻译**：Bison 在编译时，会将中间的 `{ 动作 1 }` 隐式改写为一个产生空串的虚非终结符 `M`（即 `A : B M C` 和 `M : ε { 动作 1 }`）。
*   **寻址偏移陷阱**：在最后的 `{ 动作 2 }` 中，符号的索引位置会随之发生偏移！
    *   `$1` 对应 `B`。
    *   `$2` 对应中间动作 `{ 动作 1 }` 的返回值（即 `M` 的值）。
    *   `$3` 对应 `C`。
    *   如果忘记计算中间动作的占位，后面的属性值索引将完全数错。

### 痛点二：二义性文法的冲突消除规则
Bison 默认在移进-归约冲突时选择 **Shift (移进)**，在归约-归约冲突时选择 **先声明的产生式归约**。但我们可以显式使用优先级指令消除冲突：
1.  **左结合** `%left`：如 `%left '+' '-'`。面临移进 `+` 还是按 `+` 归约时，决定执行**归约**。
2.  **右结合** `%right`：如 `%right '='`。遇到冲突时执行**移进**。
3.  **非结合** `%nonassoc`：如 `%nonassoc '<'`。强制限制 `a < b < c` 连续比较为非法。

---

## 4. 🔗 关联上下文 (双链图谱)

- **上级章节 MOC**：[[00_Chapter6_语义分析_题型总览]]
- **前置底层理论**：[[LALR(1)分析算法]] / [[属性文法]]
- **孪生对比工具**：[[Bison工程落地（从设计图纸到能跑的生产线）]]
- **典型实践真题**：[[Ex6.3_属性文法_二叉搜索树有序性判定]]


