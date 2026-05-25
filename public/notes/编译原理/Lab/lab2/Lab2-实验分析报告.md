---
tags: [编译原理, 实验, Yacc, Bison, AST, 冲突分析]
created: 2026-05-25
status: active
---

# Lab 2 科学计算器语法分析——实验分析报告

> Flex 负责认识词，Bison 负责理解句子。本报告覆盖从项目结构到 .y 文法逐条解析、AST 构造、符号表、冲突根因与消解、构建与测试的全链路分析。

---

## 1. Lab 1 和 Lab 2 的本质区别

| 维度       | Lab 1                        | Lab 2                                                   |
| -------- | ---------------------------- | ------------------------------------------------------- |
| **工具**   | Flex（词法分析器生成器）               | Bison/YACC（语法分析器生成器）                                    |
| **输入**   | 字符流 `3.14 + sin(2)`          | token 流 `NUMBER PLUS SIN LPAREN NUMBER RPAREN`          |
| **输出**   | token 类型和词素                  | AST（语法树）+ 求值结果                                          |
| **控制流**  | `main → yylex → print token` | `main → yyparse → yylex → grammar reduction → AST/eval` |
| **核心问题** | 这些字符是什么词？                    | 这些词怎样组成合法表达式？表达式是什么意思？                                  |

[[编译原理/编译原理对话记录/编译原理：自底向上语法分析|Lab 1]] 的 lexer 被保留并改造，作为 [[编译原理/Yacc与LALR(1)|Bison]] 的 token 前端。但 Lab 2 的主程序入口从 `yylex()` 变成了 `yyparse()`，控制流完全重建。

---

## 2. 项目结构

```
lab2/
├── src/
│   ├── calculator.l       # Flex 词法文件（改造自 Lab 1）
│   ├── calculator.y       # Bison 文法文件（核心）
│   ├── ast.h / ast.c      # AST 节点定义、构造、打印、求值
│   └── symtab.h / symtab.c # 符号表 + memory 寄存器
├── test/
│   └── sample.calc        # 完整测试用例集
├── docs/
│   ├── Conflict_Analysis_notes.md
│   └── Lab2_Analysis_Report_CN.md
├── build.ps1              # Windows 一键构建脚本
├── README.md
└── arith_expr_scanner_lab1_copy/  # Lab 1 参考副本（非核心工程）
```

构建命令：

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

运行测试：

```powershell
Get-Content test\sample.calc | .\build\calculator.exe
```

---

## 3. .y 文件的五段结构

Bison 文件 `calculator.y` 用两个 `%%` 分成三大段，但实际可分为五个逻辑层：

### 3.1 C 声明区（`%{ %}`）

```c
%{
#include "ast.h"
#include "symtab.h"
#include <stdio.h>
#include <stdlib.h>

int yylex(void);
void yyerror(const char *message);
extern int yylineno;
static void handle_statement(Node *node);
%}
```

这段原样复制进 Bison 生成的 C 文件。作用：
- 引入 AST 和符号表模块
- 声明 `yylex()`——告诉 Bison token 从 Flex 来
- 声明 `yyerror()`——语法错误报告
- 声明 `handle_statement()`——解析完成后打印 AST 和求值

### 3.2 `%union`——语义值联合类型

```yacc
%union {
    double number;    // 数字的值
    char *text;       // 变量名的字符串
    Node *node;       // AST 节点指针
}
```

Bison 中每个 token 和非终结符都可以携带一个语义值。`%union` 定义了所有可能的类型。这与 [[编译原理/关系图谱-节点内容/综合属性|综合属性]]的理论对应——`yylval` 和 `$$`/`$n` 的类型都由 `%union` 决定。

### 3.3 Token 声明

```yacc
%token <number> NUMBER
%token <text> ID
%token SIN COS TAN LOG LN LOG10
%token PI_CONST E_CONST
%token MR MC M_PLUS M_MINUS POW
```

| 声明 | 含义 |
|------|------|
| `%token <number> NUMBER` | NUM 使用 union 的 `number` 字段 |
| `%token <text> ID` | ID 使用 union 的 `text` 字段 |
| `%token SIN` 等 | 关键字 token，不需要额外值 |

> `+ - * / ( ) = ^` 等单字符 token 不需声明，lexer 直接 `return yytext[0]` 即可，Bison 文法中直接写 `expr '+' expr`。

### 3.4 非终结符类型声明

```yacc
%type <node> expr
```

这表示 `expr` 的语义值类型是 `Node*`——每当 parser 识别出一个表达式，都得到一棵 AST 子树。规约时：

```yacc
expr '+' expr { $$ = ast_binary("+", $1, $3); }
```

`$$` 是左边 `expr` 的值，`$1` 和 `$3` 是两个子 `expr` 的 AST。这正是 [[编译原理/Yacc与LALR(1)#三、语义动作与属性传递|Yacc 属性传递]]的标准范式。

### 3.5 优先级与结合性声明

```yacc
%left '+' '-'
%left '*' '/'
%right '^' POW
%right UMINUS
```

| 声明 | 含义 |
|------|------|
| `%left '+' '-'` | 加减左结合 |
| `%left '*' '/'` | 乘除左结合，**写在加减后面 → 优先级更高** |
| `%right '^' POW` | 幂运算右结合 |
| `%right UMINUS` | 一元负号的虚拟优先级（最高） |

Bison 的优先级规则：**越靠后声明，优先级越高**。这直接解决 [[编译原理/关系图谱-节点内容/移进-归约冲突|shift/reduce 冲突]]——详见下文第 10 节。

---

## 4. 文法规则逐条解析

### 4.1 程序入口 `input`

```yacc
input: /* empty */
     | input statement terminator
     | input terminator
     ;
```

递归结构，允许多行输入和空行。每条语句由 `terminator` 结束。

### 4.2 语句结束符 `terminator`

```yacc
terminator: '\n' | ';' ;
```

换行或分号均可作为语句分隔符。

### 4.3 `statement` 五种语句类型

```yacc
statement: expr                        { handle_statement($1); }
         | ID '=' expr                 { handle_statement(ast_assign($1, $3)); free($1); }
         | MC                          { handle_statement(ast_memory(MEM_CLEAR, NULL)); }
         | M_PLUS expr                 { handle_statement(ast_memory(MEM_ADD, $2)); }
         | M_MINUS expr                { handle_statement(ast_memory(MEM_SUB, $2)); }
         ;
```

| 类型 | 示例 | 语义动作 |
|------|------|----------|
| 表达式 | `2 + 3 * 4` | 打印 AST + 求值 |
| 赋值 | `x = 5` | 创建 Assign 节点，写入符号表 |
| 清空内存 | `MC` | memory = 0 |
| 内存加 | `M+ 10` | memory += expr |
| 内存减 | `M- 3` | memory -= expr |

每条语句最终调用 `handle_statement()`：打印 AST → 求值 → 输出结果 → 释放 AST。

### 4.4 `expr` 完整规则与 AST 构造

#### 数字
```yacc
NUMBER { $$ = ast_number($1); }
```
`$1` 是 lexer 传来的 `double` 值，构造常量节点 `c(3.1400)`。

#### 变量引用
```yacc
ID { $$ = ast_identifier($1); free($1); }
```
构造 `id(x)` 节点，求值时查符号表。

#### 常量
```yacc
PI_CONST { $$ = ast_number(3.14159265358979323846); }
E_CONST  { $$ = ast_number(2.71828182845904523536); }
```
PI、e 当作常量节点处理。

#### Memory recall
```yacc
MR { $$ = ast_memory(MEM_RECALL, NULL); }
```
`MR` 本身可以作为表达式参与运算：`MR * 2`。

#### 二元运算
```yacc
expr '+' expr { $$ = ast_binary("+", $1, $3); }
expr '-' expr { $$ = ast_binary("-", $1, $3); }
expr '*' expr { $$ = ast_binary("*", $1, $3); }
expr '/' expr { $$ = ast_binary("/", $1, $3); }
expr '^' expr { $$ = ast_binary("^", $1, $3); }
expr POW expr { $$ = ast_binary("**", $1, $3); }
```
每个二元运算创建运算符节点。在 `%left`/`%right` 作用下，`2 + 3 * 4` 自动解析为 `2 + (3 * 4)`。

#### 一元负号
```yacc
'-' expr %prec UMINUS { $$ = ast_unary("-", $2); }
```
`%prec UMINUS` 的意思是：这条规则不继承 `-` 的优先级，而使用虚拟 token `UMINUS` 的较高优先级。解决一元负号和二元减号的混淆。

#### 括号
```yacc
'(' expr ')' { $$ = $2; }
```
括号直接透传内部 `expr` 的 AST，不需要创建括号节点。

#### 函数调用
```yacc
SIN '(' expr ')'   { $$ = ast_function("sin", $3); }
COS '(' expr ')'   { $$ = ast_function("cos", $3); }
TAN '(' expr ')'   { $$ = ast_function("tan", $3); }
LOG '(' expr ')'   { $$ = ast_function("log", $3); }
LN '(' expr ')'    { $$ = ast_function("ln", $3); }
LOG10 '(' expr ')' { $$ = ast_function("log10", $3); }
```
函数节点只有一个子节点（参数）。`sin(cos(0.5))` 生成嵌套函数 AST。

---

## 5. Flex lexer 如何配合 Bison

### 5.1 引入 Bison 生成的头文件

```c
#include "ast.h"
#include "calculator.tab.h"
```

`calculator.tab.h` 是 Bison 生成的，含 token 编号和 `YYSTYPE`。`ast.h` 必须先于 `calculator.tab.h` 引入，因为 `%union` 中有 `Node*`。

### 5.2 数字 token

```c
{DECIMAL} { yylval.number = strtod(yytext, NULL); return NUMBER; }
{BINARY}  { yylval.number = parse_binary(yytext); return NUMBER; }
{OCTAL}   { yylval.number = parse_prefixed_integer(yytext, 8); return NUMBER; }
{HEX}     { yylval.number = parse_prefixed_integer(yytext, 16); return NUMBER; }
```

所有进制的数字统一返回 `NUMBER` token，parser 不需要关心进制转换。

### 5.3 关键字优先于 ID

```c
"sin" { return SIN; }
"cos" { return COS; }
"MR"  { return MR; }
"MC"  { return MC; }
```

关键字规则必须在通用 `ID` 规则**之前**，否则 `sin` 会被误识别为变量名。

### 5.4 单字符直接返回

```c
"+"|"-"|"*"|"/"|"^"|"("|")"|"=" { return yytext[0]; }
```

不需要单独命名 token，Bison 文法中直接写字符即可。

---

## 6. AST 设计

### 6.1 节点类型枚举

```c
typedef enum NodeKind {
    NODE_NUMBER,      // 常量 3.14
    NODE_IDENTIFIER,  // 变量 x
    NODE_BINARY,      // 二元 a + b
    NODE_UNARY,       // 一元 -x
    NODE_FUNCTION,    // 函数 sin(x)
    NODE_ASSIGN,      // 赋值 x = 5
    NODE_MEMORY       // 内存 MC, MR, M+ 10
} NodeKind;
```

### 6.2 节点结构

```c
typedef struct Node {
    NodeKind kind;
    char op[16];        // 运算符或函数名
    double value;       // 数字节点的值
    char *name;         // 变量名
    MemoryOp mem_op;    // 内存操作类型
    struct Node *left;
    struct Node *right;
} Node;
```

一个通用结构覆盖所有节点类型：`value` 给数字节点，`name` 给变量和赋值节点，`op` 给运算符和函数节点，`mem_op` 给内存节点。

### 6.3 求值函数

```c
double ast_eval(const Node *node, int *ok);
```

递归遍历 AST：
- `NODE_NUMBER` → 返回 `node->value`
- `NODE_IDENTIFIER` → `symtab_get(node->name, ok)`
- `NODE_BINARY` → 递归求左右子树，执行运算
- `NODE_UNARY` → 递归求子树，取负
- `NODE_FUNCTION` → 递归求参数，调用 `sin`/`cos` 等
- `NODE_ASSIGN` → 求右子树值，写入符号表
- `NODE_MEMORY` → 操作 `calculator_memory` 全局变量

---

## 7. 符号表与 Memory

### 7.1 符号表（链表）

```c
typedef struct Symbol {
    char *name;
    double value;
    struct Symbol *next;
} Symbol;

void symtab_set(const char *name, double value);
double symtab_get(const char *name, int *ok);
void symtab_clear(void);
```

### 7.2 Memory（独立寄存器）

```c
static double calculator_memory = 0.0;

void symtab_memory_clear(void)   { calculator_memory = 0; }
void symtab_memory_add(double v) { calculator_memory += v; }
void symtab_memory_sub(double v) { calculator_memory -= v; }
double symtab_memory_recall(void) { return calculator_memory; }
```

Memory 是全局变量，独立于符号表。`MC`/`M+`/`M-`/`MR` 只操作这块内存。

---

## 8. 冲突分析

### 8.1 什么是 shift/reduce conflict

当 parser 看到 `2 + 3` 后遇到 `*`，有两个选择：
- **reduce**：先把 `2 + 3` 规约为一个 `expr`
- **shift**：先读入 `*`，继续解析 `3 * 4`

无优先级声明时 Bison 默认 **优先 shift**（这就是 `if-else` 悬挂歧义能自动处理的原因）。但对于算术表达式，shift 优先会导致 `2 + 3 * 4` 变成 `(2 + 3) * 4`——错误。

### 8.2 四个典型冲突与解决

| # | 输入 | 冲突原因 | 解决 |
|:--:|------|----------|------|
| 1 | `2 + 3 * 4` | 加法和乘法优先级不明 | `%left '*' '/'` 写在 `'+' '-'` 后面 → 乘除优先级更高 |
| 2 | `10 - 3 - 2` | 减法结合性不明 | `%left '-'` → 左结合 `(10-3)-2` |
| 3 | `2 ^ 3 ^ 2` | 幂运算结合性 | `%right '^'` → 右结合 `2^(3^2)` |
| 4 | `-5 - 3` | 一元负号与二元减号混淆 | `%right UMINUS` + `%prec UMINUS` |

### 8.3 `.output` 文件中的消解记录

构建时 `bison -v --report=all` 生成的 `.output` 文件包含：

```
Conflict between rule 16 and token '*' resolved as shift ('+' < '*').
Conflict between rule 17 and token '-' resolved as reduce (%left '-').
Conflict between rule 20 and token '^' resolved as shift (%right '^').
Conflict between rule 22 and token '-' resolved as reduce ('-' < UMINUS).
```

这说明冲突不是"没有出现"，而是**已经被优先级声明自动消解**——这是 [[编译原理/LR系列对比总览|LALR(1) 理论]]在工程中的直接体现。

### 8.4 实验报告建议

报告中应先展示**无优先级版本**的冲突，再展示最终消解后的结果：
1. 临时移除 `%left`/`%right`/`%prec`
2. `bison -v` 生成未消解版本 `.output`
3. 从中挑 ≥3 个冲突状态分析
4. 展示最终版本如何消解

---

## 9. 测试用例

测试文件 `test/sample.calc`：

```
(1 + 2) * 3
sin(cos(0.5))
2^3*4
log10(100) + ln(e)
x = 5
y = x + 2
y
MC
M+ 10
M+ 5
MR * 2
0b1010 + 0x10 + 0o7
```

| # | 输入 | 预计结果 | 覆盖功能 |
|:--:|------|:--:|------|
| 1 | `(1+2)*3` | 9 | 括号 + 基本算术 |
| 2 | `sin(cos(0.5))` | ~0.8776 | 嵌套三角函数 |
| 3 | `2^3*4` | 32 | 幂运算优先级 |
| 4 | `log10(100)+ln(e)` | 3 | 对数 + 常量 |
| 5-7 | `x=5; y=x+2; y` | 7 | 变量赋值与引用 |
| 8-11 | `MC; M+10; M+5; MR*2` | 30 | 内存操作序列 |
| 12 | `0b1010+0x10+0o7` | 33 | 多进制数字 |

---

## 10. 后续建议

1. 做无优先级 grammar 版本，用 `bison -v` 稳定生成冲突
2. 从 `.output` 截取 ≥3 个未解决冲突状态，写入 `Conflict_Analysis.pdf`
3. 将本文改写为英文 `Design_Report.pdf`
4. 为每个测试用例整理预期 AST 和预期 numeric result
5. 给 `.l` 和 `.y` 补充完整英文注释

---

## 关联笔记

| 概念 | 笔记 |
|------|------|
| Lab 2 实验要求 | [[编译原理/Lab/lab2/Lab2-YACC科学计算器语法分析]] |
| LALR(1) 理论 | [[编译原理/LR系列对比总览]] |
| Yacc 语法规则与语义动作 | [[编译原理/Yacc与LALR(1)]] |
| shift/reduce 冲突 | [[编译原理/关系图谱-节点内容/移进-归约冲突]] |
| 综合属性 | [[编译原理/关系图谱-节点内容/综合属性]] |
| S-属性文法 | [[编译原理/关系图谱-节点内容/S-属性文法]] |
| 属性文法 | [[编译原理/关系图谱-节点内容/属性文法]] |
| Lab 1 词法分析 | [[编译原理/编译原理对话记录/编译原理：自底向上语法分析]] |
| 编译原理阶段总结 | [[编译原理/编译原理阶段总结]] |
