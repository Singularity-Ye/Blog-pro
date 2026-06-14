---
tags: [编译原理, 实验, Yacc, Bison, AST, 冲突分析]
created: 2026-05-25
status: active
---

# Lab 2 科学计算器语法分析——实验分析报告

> 本报告按照"**先理解要构建什么，再理解怎么构建**"的顺序展开：数据流概览 → 数据结构（AST、符号表）→ 语法规范（Bison 文件结构、文法规则）→ 工具配合（Flex + Bison）→ 问题解决（冲突分析）。

---

## 1. Lab 2 总体目标

Lab 1 已经用 Flex 完成了词法分析——输入字符串 `3.14 + sin(2)` 被切分成 token 流 `NUMBER PLUS SIN LPAREN NUMBER RPAREN`。

Lab 2 的任务是：**接收 token 流，按语法规则识别出表达式的层次结构，构造抽象语法树（AST），然后求值。**

具体来说要做四件事：

| # | 工作 | 说明 |
|:--:|------|------|
| 1 | **文法设计** | 用 Bison 写 `.y` 文件，定义算术、三角函数、变量赋值、内存操作等语法规则 |
| 2 | **AST 构造** | 在每条语法规则的语义动作中构造 AST 节点，规约完成后得到一棵完整的语法树 |
| 3 | **求值** | 遍历 AST，递归计算每个节点的值（查符号表、执行运算、调用数学函数） |
| 4 | **冲突分析** | 先用无优先级的"有冲突版"文法观察 shift/reduce 冲突，再用 `%left`/`%right`/`%prec` 消解 |

---

## 2. 整体数据流

理解一个完整的表达式如何从字符串变成结果，是看懂整个项目的关键：

```
输入字符串 "x = 3 + 4 * 2"
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Flex (calculator.l)                                    │
│  字符流 → 正则匹配 → token 流                            │
│  输出: ID("x")  '='  NUMBER(3)  '+'  NUMBER(4)          │
│         '*'  NUMBER(2)  '\n'                            │
│  关键: yylval.number = 3.0  (把数值传给 Bison)           │
│        yylval.text   = "x"  (把变量名传给 Bison)         │
└─────────────────────────────────────────────────────────┘
    │  token 流 (每个 token = 类型编号 + 语义值)
    ▼
┌─────────────────────────────────────────────────────────┐
│  Bison (calculator.y)                                   │
│  token 流 → LALR(1) 分析 → 移进/规约 → 语义动作          │
│                                                         │
│  规约过程示例:                                           │
│  NUMBER(4) '*' NUMBER(2)                                │
│    → 规约为 expr: ast_binary("*", c(4), c(2))           │
│                                                         │
│  NUMBER(3) '+' expr(*)                                  │
│    → 规约为 expr: ast_binary("+", c(3), expr(*))        │
│                                                         │
│  ID("x") '=' expr(+)                                    │
│    → 规约为 stmt: ast_assign("x", expr(+))              │
└─────────────────────────────────────────────────────────┘
    │  规约完成后得到一棵 AST
    ▼
┌─────────────────────────────────────────────────────────┐
│  handle_statement(node)                                 │
│  1. ast_print(node)  → 输出语法树结构                    │
│  2. ast_eval(node)   → 递归求值 → 输出计算结果            │
│  3. ast_free(node)   → 释放 AST 内存                     │
└─────────────────────────────────────────────────────────┘
    │
    ▼
输出:
  AST: =(x, +(c(3), *(c(4), c(2))))
  Result: 11.0000
```

关键认知：
- **Flex 只管"这些字符是什么词"**，输出 token 类型和词素值
- **Bison 只管"这些词怎样组成合法句子"**，在规约时通过语义动作构造 AST
- **AST 模块只管"这棵树什么意思"**，递归遍历求值
- 三个模块职责清晰，通过 `yylval` 和 `$$`/`$n` 传递数据

---

## 3. AST 设计

在写 Bison 文法之前，必须先设计好 AST——因为每一条语法规则的语义动作都是在构造 AST 节点。先有数据结构，才有文法规则。

### 3.1 节点类型 NodeKind

```c
typedef enum NodeKind {
    NODE_NUMBER,      // 常量，如 3.14
    NODE_IDENTIFIER,  // 变量，如 x
    NODE_BINARY,      // 二元运算，如 a + b
    NODE_UNARY,       // 一元运算，如 -x
    NODE_FUNCTION,    // 函数调用，如 sin(x)
    NODE_ASSIGN,      // 赋值，如 x = 5
    NODE_MEMORY       // 内存操作，如 MC, MR, M+ 10
} NodeKind;
```

每种节点类型对应一类语法结构。Bison 规约时根据规则类型创建不同 kind 的节点。

### 3.2 节点结构 Node

```c
typedef struct Node {
    NodeKind kind;       // 节点类型
    char op[16];         // 运算符（"+", "-", "*"）或函数名（"sin", "log"）
    double value;        // 数字节点的值
    char *name;          // 变量名（标识符节点和赋值节点的左部）
    MemoryOp mem_op;     // 内存操作类型（MEM_CLEAR / MEM_RECALL / MEM_ADD / MEM_SUB）
    struct Node *left;   // 左子节点
    struct Node *right;  // 右子节点
} Node;
```

一个通用结构覆盖所有节点类型，通过 `kind` 区分具体用途：

| 节点类型 | 有效字段 | 示例 |
|----------|----------|------|
| `NODE_NUMBER` | `value = 3.14` | `c(3.1400)` |
| `NODE_IDENTIFIER` | `name = "x"` | `id(x)` |
| `NODE_BINARY` | `op = "+"`, `left`, `right` | `+(a, b)` |
| `NODE_UNARY` | `op = "-"`, `left` | `-(x)` |
| `NODE_FUNCTION` | `op = "sin"`, `left`(参数) | `sin(x)` |
| `NODE_ASSIGN` | `name = "x"`, `right`(值) | `=(x, expr)` |
| `NODE_MEMORY` | `mem_op`, `left`(M+/M-的操作数) | `M+(10)` |

### 3.3 AST 构造函数

每个节点类型有对应的构造函数，在 Bison 语义动作中调用：

```c
Node *ast_number(double value);                          // 常量节点
Node *ast_identifier(char *name);                         // 变量节点
Node *ast_binary(const char *op, Node *left, Node *right); // 二元运算节点
Node *ast_unary(const char *op, Node *expr);              // 一元运算节点
Node *ast_function(const char *name, Node *arg);          // 函数调用节点
Node *ast_assign(char *name, Node *value);                // 赋值节点
Node *ast_memory(MemoryOp op, Node *expr);                // 内存操作节点
```

例如，Bison 规则中这样使用：

```yacc
expr '+' expr { $$ = ast_binary("+", $1, $3); }
```

`$1` 是左操作数的 AST，`$3` 是右操作数的 AST，`$$` 是父节点——这正是 [[综合属性|综合属性]] 的思想：子节点的属性合成父节点的属性。

### 3.4 AST 打印函数

```c
void ast_print(const Node *node, int indent);
```

递归缩进打印，例如 `2 + 3 * 4` 输出：

```
BinaryOp(+)
  Const(2)
  BinaryOp(*)
    Const(3)
    Const(4)
```

让读者直观看到运算符优先级：乘法在加法下面（更深），说明先算乘法。

### 3.5 AST 求值函数

```c
double ast_eval(const Node *node, int *ok);
```

递归遍历 AST，按 `kind` 分支处理：

```
NODE_NUMBER     → 返回 node->value
NODE_IDENTIFIER → symtab_get(node->name, ok)
NODE_BINARY     → 递归求左右子树，执行 + - * / ^
NODE_UNARY      → 递归求子树，取负
NODE_FUNCTION   → 递归求参数，调用 sin/cos/tan/log/ln/log10
NODE_ASSIGN     → 求右子树值，symtab_set(name, value)
NODE_MEMORY     → 操作 calculator_memory 全局变量
```

`ok` 参数用于错误传播：除零、未定义变量、无效内存操作都会置 `ok=0`，上层据此决定是否继续求值。

---

## 4. 符号表与 Memory 设计

AST 求值需要两个存储机制：符号表存变量，memory 存独立的内存寄存器。

### 4.1 变量表（符号表）

用单向链表实现，支持插入、查找、清空：

```c
typedef struct Symbol {
    char *name;
    double value;
    struct Symbol *next;
} Symbol;

void    symtab_set(const char *name, double value);   // 插入或更新
double  symtab_get(const char *name, int *ok);        // 查找（未找到则 ok=0）
void    symtab_clear(void);                           // 清空全部
```

典型使用场景：

```
x = 5        → symtab_set("x", 5)
y = x + 2    → symtab_get("x") 得到 5，计算得 7，symtab_set("y", 7)
y            → symtab_get("y") 得到 7
```

链表实现简单够用，对于计算器级别的变量数量完全足够。

### 4.2 calculator_memory（内存寄存器）

Memory 是独立于符号表的全局变量，模拟计算器上的 M 寄存器：

```c
static double calculator_memory = 0.0;

void    symtab_memory_clear(void)   { calculator_memory = 0; }
void    symtab_memory_add(double v) { calculator_memory += v; }
void    symtab_memory_sub(double v) { calculator_memory -= v; }
double  symtab_memory_recall(void)  { return calculator_memory; }
```

| Token | 操作 | 对应函数 |
|-------|------|----------|
| `MC` | 清空内存 | `symtab_memory_clear()` |
| `MR` | 读取内存值 | `symtab_memory_recall()` |
| `M+ expr` | 内存 += expr | `symtab_memory_add(val)` |
| `M- expr` | 内存 -= expr | `symtab_memory_sub(val)` |

> **为什么 Memory 不做成符号表里的一个变量？** 因为它的语义不同——`M+` 是累加而非赋值。把 memory 独立出来让语义动作更清晰。

---

## 5. Bison 文件结构

有了 AST 和符号表的数据结构之后，再来看 Bison 的 `.y` 文件如何组织。一个 `.y` 文件用两个 `%%` 分成三大段，但在逻辑上可以分为五个层次。

### 5.1 C 声明区（`%{ %}`）

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

这段代码会被原样复制进 Bison 生成的 C 文件。作用：
- **引入头文件**：让 Bison 生成的代码能使用 AST 和符号表模块
- **声明 `yylex()`**：告诉 Bison token 从 Flex 来
- **声明 `yyerror()`**：语法错误时的回调函数
- **声明 `handle_statement()`**：每条语句解析完成后的处理入口

### 5.2 %union —— 语义值联合类型

```yacc
%union {
    double number;    // 数字的值（NUMBER token 用）
    char *text;       // 变量名的字符串（ID token 用）
    Node *node;       // AST 节点指针（所有非终结符用）
}
```

Bison 中每个 token 和非终结符都可以携带一个语义值。`%union` 定义了所有可能的类型——这对应 [[综合属性|综合属性]] 理论中"属性可以是什么类型"这一概念。`yylval`（Flex 传给 Bison）和 `$$`/`$n`（Bison 内部传递）的类型都由 `%union` 决定。

### 5.3 Token 声明

```yacc
%token <number> NUMBER
%token <text> ID
%token SIN COS TAN LOG LN LOG10
%token PI_CONST E_CONST
%token MR MC M_PLUS M_MINUS POW
```

| 声明 | 含义 |
|------|------|
| `%token <number> NUMBER` | NUMBER 使用 union 的 `number` 字段（存 double） |
| `%token <text> ID` | ID 使用 union 的 `text` 字段（存字符串指针） |
| `%token SIN` 等 | 关键字 token，不需要额外值，只靠类型编号区分 |

> `+ - * / ( ) = ^` 等单字符 token 不需要声明——Flex 直接 `return yytext[0]`，Bison 文法中直接写 `expr '+' expr`。

### 5.4 非终结符类型声明

```yacc
%type <node> expr
```

表示 `expr` 的语义值类型是 `Node*`——每当 parser 识别出一个表达式，都会得到一棵 AST 子树。

规约时的语义动作：

```yacc
expr '+' expr { $$ = ast_binary("+", $1, $3); }
```

- `$$` 是等号左边 `expr` 的值（归约结果）
- `$1` 是第一个 `expr` 的 AST（左操作数）
- `$3` 是第二个 `expr` 的 AST（右操作数）

这正是 [[Bison工程落地（从设计图纸到能跑的生产线）#📦 属性传递与求值：分析栈旁的“行李传送带”|Yacc 属性传递]] 的标准范式。

### 5.5 优先级与结合性声明

```yacc
%left '+' '-'
%left '*' '/'
%right '^' POW
%right UMINUS
```

| 声明 | 含义 |
|------|------|
| `%left '+' '-'` | 加减左结合（`10-3-2` → `(10-3)-2`） |
| `%left '*' '/'` | 乘除左结合，**写在加减后面 → 优先级更高** |
| `%right '^' POW` | 幂运算右结合（`2^3^2` → `2^(3^2)`） |
| `%right UMINUS` | 一元负号的虚拟优先级（最高） |

**Bison 的优先级规则：越靠后声明，优先级越高。** 这直接决定了 shift/reduce 冲突的消解方向——详见第 8 节。

---

## 6. 文法规则与语义动作

文法规则是 `.y` 文件的核心。每条规则由"产生式"和"语义动作"两部分组成：产生式描述语法结构，语义动作描述如何构造 AST。

### 6.1 程序入口 `input`

```yacc
input: /* empty */
     | input statement terminator
     | input terminator
     ;
```

递归结构，允许多行输入和空行。每条语句由 `terminator` 结束。

### 6.2 语句结束符 `terminator`

```yacc
terminator: '\n' | ';' ;
```

换行或分号均可作为语句分隔符——兼容交互式和脚本式输入。

### 6.3 `statement`——五种语句类型

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
| 赋值 | `x = 5` | 创建 Assign 节点，求值时写入符号表 |
| 清空内存 | `MC` | memory = 0 |
| 内存加 | `M+ 10` | memory += expr |
| 内存减 | `M- 3` | memory -= expr |

每条语句最终调用 `handle_statement()`：打印 AST → 求值 → 输出结果 → 释放 AST。

### 6.4 `expr`——完整规则与 AST 构造

#### 数字

```yacc
NUMBER { $$ = ast_number($1); }
```

`$1` 是 Flex 传来的 `double` 值（已在 lexer 中完成进制转换），直接构造常量节点 `c(3.1400)`。

#### 变量引用

```yacc
ID { $$ = ast_identifier($1); free($1); }
```

构造 `id(x)` 节点，求值时查符号表。注意 `$1` 是 `strdup` 出来的字符串，用完后 `free`。

#### 数学常量

```yacc
PI_CONST { $$ = ast_number(3.14159265358979323846); }
E_CONST  { $$ = ast_number(2.71828182845904523536); }
```

PI 和 e 本质就是常量，不需要特殊节点，直接创建 `NODE_NUMBER`。

#### Memory recall

```yacc
MR { $$ = ast_memory(MEM_RECALL, NULL); }
```

`MR` 本身可以作为表达式参与运算：`MR * 2` 表示内存值乘以 2。

#### 二元运算

```yacc
expr '+' expr { $$ = ast_binary("+", $1, $3); }
expr '-' expr { $$ = ast_binary("-", $1, $3); }
expr '*' expr { $$ = ast_binary("*", $1, $3); }
expr '/' expr { $$ = ast_binary("/", $1, $3); }
expr '^' expr { $$ = ast_binary("^", $1, $3); }
expr POW expr { $$ = ast_binary("**", $1, $3); }
```

每个二元运算创建运算符节点。在 `%left`/`%right` 作用下，`2 + 3 * 4` 自动解析为 `2 + (3 * 4)`——Bison 看到 `+` 后的 `*` 会选择 shift 而非 reduce。

> `^` 和 `**` 都表示幂运算，用相同的 `ast_binary("^", ...)` ——前端提供两种写法，后端统一处理。

#### 一元负号

```yacc
'-' expr %prec UMINUS { $$ = ast_unary("-", $2); }
```

`%prec UMINUS` 是关键：它让这条规则不继承 `-` 的优先级，而使用虚拟 token `UMINUS` 的较高优先级。没有它，`-5 - 3` 会被错误解析。

#### 括号

```yacc
'(' expr ')' { $$ = $2; }
```

括号只改变解析顺序，不产生新的 AST 节点——直接透传内部 `expr` 的 AST。

#### 函数调用

```yacc
SIN '(' expr ')'   { $$ = ast_function("sin", $3); }
COS '(' expr ')'   { $$ = ast_function("cos", $3); }
TAN '(' expr ')'   { $$ = ast_function("tan", $3); }
LOG '(' expr ')'   { $$ = ast_function("log", $3); }
LN '(' expr ')'    { $$ = ast_function("ln", $3); }
LOG10 '(' expr ')' { $$ = ast_function("log10", $3); }
```

函数节点只有一个子节点（参数）。`sin(cos(0.5))` 会生成嵌套函数 AST：

```
Function(sin)
  Function(cos)
    Const(0.5)
```

---

## 7. Flex 与 Bison 的配合

Bison 不直接读字符——它从 `yylex()` 拿 token。`yylex()` 由 Flex 生成，两者的接口就是 token 编号和 `yylval`。

### 7.1 头文件引入顺序

```c
/* calculator.l */
#include "ast.h"              // 先引入，因为 YYSTYPE 中有 Node*
#include "calculator.tab.h"   // Bison 生成的头文件，含 token 编号和 YYSTYPE
```

`calculator.tab.h` 是 Bison 用 `-d` 选项生成的。`ast.h` 必须先引入，因为 `%union` 中有 `Node*`——编译器需要先看到 `Node` 的定义。

### 7.2 NUMBER 如何传 double

```c
{DECIMAL} { yylval.number = strtod(yytext, NULL); return NUMBER; }
{BINARY}  { yylval.number = parse_binary(yytext); return NUMBER; }
{OCTAL}   { yylval.number = parse_prefixed_integer(yytext, 8); return NUMBER; }
{HEX}     { yylval.number = parse_prefixed_integer(yytext, 16); return NUMBER; }
```

所有进制的数字统一返回 `NUMBER` token。进制转换在 lexer 中完成，parser 不需要关心——词法和语法职责分离的体现。

### 7.3 关键字优先于 ID

```c
"sin"  { return SIN; }
"cos"  { return COS; }
"MR"   { return MR; }
"MC"   { return MC; }
"M+"   { return M_PLUS; }
"M-"   { return M_MINUS; }
```

**关键字规则必须在通用 `ID` 规则之前。** Flex 的匹配策略是"最长匹配优先，同长度先声明优先"。如果把 `ID` 写在前面，`sin` 会被当成变量名。

> 特别注意：`M+` 不能返回 `M_PLUS` 的同时让后续的 `+` 被单独匹配——Flex 会取最长匹配，所以 `M+` 整体作为一个 token 返回 `M_PLUS`。

### 7.4 单字符 token

```c
"+"|"-"|"*"|"/"|"^"|"("|")"|"=" { return yytext[0]; }
```

不需要在 Bison 中声明 token 名称，文法中直接写字符即可：

```yacc
expr '+' expr { $$ = ast_binary("+", $1, $3); }
```

---

## 8. 冲突分析与解决

有了完整的语法规则后，接下来的问题是：**规则之间产生歧义怎么办？** 这就是冲突分析的意义。

### 8.1 什么是 shift/reduce conflict

当 parser 看到 `2 + 3` 后遇到 `*`，有两个选择：
- **reduce**：先把 `2 + 3` 规约为一个 `expr`
- **shift**：先读入 `*`，继续解析 `3 * 4`

无优先级声明时 Bison 默认**优先 shift**（这就是 `if-else` 悬挂歧义能自动处理的原因）。但对于算术表达式，shift 优先会导致 `2 + 3 * 4` 变成 `(2 + 3) * 4`——错误。

### 8.2 四个典型冲突与解决

| # | 输入 | 冲突原因 | 解决 |
|:--:|------|----------|------|
| 1 | `2 + 3 * 4` | 加法和乘法优先级不明 | `%left '*' '/'` 写在 `'+' '-'` 后面 → 乘除优先级更高 |
| 2 | `10 - 3 - 2` | 减法结合性不明 | `%left '-'` → 左结合 `(10-3)-2` |
| 3 | `2 ^ 3 ^ 2` | 幂运算结合性 | `%right '^'` → 右结合 `2^(3^2)` |
| 4 | `-5 - 3` | 一元负号与二元减号混淆 | `%right UMINUS` + `%prec UMINUS` |

### 8.3 `.output` 文件中的消解记录

构建时 `bison -v --report=all` 生成的 `.output` 文件包含自动消解记录：

```
Conflict between rule 16 and token '*' resolved as shift ('+' < '*').
Conflict between rule 17 and token '-' resolved as reduce (%left '-').
Conflict between rule 20 and token '^' resolved as shift (%right '^').
Conflict between rule 22 and token '-' resolved as reduce ('-' < UMINUS).
```

这说明冲突不是"没有出现"，而是**已经被优先级声明自动消解**——这是 [[LR家族的华山论剑（LR0、SLR、LR1与LALR的终极对比）|LALR(1) 理论]] 在工程中的直接体现。

### 8.4 实验报告的冲突分析步骤

建议在报告中展示**从无优先级到有优先级**的过程：

1. 临时移除 `%left`/`%right`/`%prec`
2. `bison -v` 生成未消解版本的 `.output`
3. 从中挑选 ≥3 个冲突状态，记录 state number、lookahead token、冲突规则和根因
4. 展示最终版本如何通过优先级声明消解这些冲突

这样能让读者理解：优先级声明不是"让 Bison 不报错就完了"，而是解决真实存在的歧义问题。

---

## 9. 测试用例

测试文件覆盖了计算器的全部功能：

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

## 10. 总结

Lab 2 的核心是从"认识词"到"理解句子"的跨越：

1. **数据流**：Flex 把字符变成 token → Bison 把 token 变成 AST → 求值器遍历 AST 计算结果
2. **AST 是桥梁**：语法规则构造 AST，求值器消费 AST。AST 的设计决定了整个项目的架构
3. **优先级的本质**：`%left`/`%right`/`%prec` 不是在"消除冲突"，而是在告诉 Bison **当歧义出现时应该选哪个方向**。理解这一点才能理解 LALR(1) 的 shift/reduce 决策机制
4. **分层协作**：Flex 只做词法、Bison 只做语法、AST 模块只做求值——职责清晰，代码才不会失控

整个项目的控制流从 Lab 1 的 `main → yylex → 打印 token` 变成了 Lab 2 的 `main → yyparse → yylex → 语法归约 → AST 构造 → 求值`。控制流的重建正是语法分析的核心。

---

## 附录：项目结构

```
lab2/
├── src/
│   ├── calculator.l       # Flex 词法文件
│   ├── calculator.y       # Bison 文法文件（核心）
│   ├── ast.h / ast.c      # AST 节点定义、构造、打印、求值
│   └── symtab.h / symtab.c # 符号表 + memory 寄存器
├── test/
│   └── sample.calc        # 完整测试用例集
├── build.ps1              # Windows 一键构建脚本
└── README.md
```

## 关联笔记

| 概念 | 笔记 |
|------|------|
| Lab 2 实验要求 | [[Lab2-YACC科学计算器语法分析]] |
| LALR(1) 理论 | [[LR家族的华山论剑（LR0、SLR、LR1与LALR的终极对比）]] |
| Yacc 语法规则与语义动作 | [[Bison工程落地（从设计图纸到能跑的生产线）]] |
| shift/reduce 冲突 | [[移进-归约冲突]] |
| 综合属性 | [[综合属性]] |
| S-属性文法 | [[S-属性文法]] |
| 属性文法 | [[属性文法]] |
| Lab 1 词法分析 | [[多模式词法分析（把多个NFA并成一张联合搜索网）|多模式词法分析]] |
| 编译原理阶段总结 | [[编译原理阶段总结]] |

---

# Part B：英文提交材料模板

> 以下五份材料直接用于 Lab 2 最终提交。填入实际代码和数据后即可导出 PDF。

---

## Report 1：Tool Survey & Comparison Report

### Introduction

This report compares several parser generators that can be used to build syntax analyzers for programming languages and calculators. The tools compared include YACC/Bison, ANTLR, PLY, Lemon, and Menhir. The comparison focuses on parsing algorithm, conflict handling, language target, debugging support, and learning curve.

### Comparison Table

| Tool | Parsing Algorithm | Conflict Handling | Language Target | Debugging Support | Learning Curve |
|------|------|------|------|------|------|
| **YACC/Bison** | LALR(1); modern Bison also supports other LR variants | Reports shift/reduce and reduce/reduce conflicts; supports `%left`/`%right`/`%nonassoc`/`%prec` | Mainly C/C++; GNU Bison also supports Java, D | `.output` verbose report, parser traces (`YYDEBUG`) | Medium |
| **ANTLR** | Adaptive LL(\*) | Avoids many LR-style conflicts by grammar prediction; ambiguity reported via diagnostics | Java, C#, Python, JavaScript, Go, C++ | Parse tree viewer, grammar diagnostics, ANTLRWorks IDE | Medium–High |
| **PLY** | LALR(1) (Python implementation) | Similar to YACC; reports conflicts and supports precedence rules | Python | Debug log files, parser table output | Medium |
| **Lemon** | LALR(1) | Designed to avoid common YACC pitfalls; reports conflicts during generation | C | Parser report files, reentrant design | Medium |
| **Menhir** | LR(1) | Strong conflict explanation and diagnostics; Coq verification possible | OCaml | Excellent conflict explanations, `--explain` flag | High |

### Why YACC/Bison Was Selected

YACC/Bison was selected for this scientific calculator project for three reasons.

First, the lab focuses on LALR parsing, shift/reduce conflicts, and precedence resolution. Bison directly exposes these conflicts through the `.output` file, making it the most suitable tool for studying how ambiguity arises and how it can be resolved.

Second, Bison works naturally with Flex. The lexer from Lab 1 can be reused as the token provider with only minor modifications to `yylval` and token declarations.

Third, Bison semantic actions (`$$`, `$n`) allow us to construct an Abstract Syntax Tree during reduction, which is a direct implementation of the synthesized attribute concept studied in this course.

Although ANTLR provides modern tooling and multi-language support, Bison is more closely related to the LR parsing theory covered in lectures and is therefore a better fit for this lab.

---

## Report 2：Bison Conflict Resolution Summary

### Default Conflict Resolution

Bison may report conflicts when the grammar allows more than one parsing action in the same parser state. The most common type is a **shift/reduce conflict**, where the parser can either shift the next input token or reduce a recognized rule. By default, Bison resolves shift/reduce conflicts by choosing **shift**. For **reduce/reduce** conflicts, Bison chooses the rule that appears **earlier** in the grammar file. However, relying on default resolution is not recommended unless the behavior is clearly intended and documented.

### Precedence and Associativity Declarations

For expression grammars, Bison provides four declarations to remove ambiguity:

- **`%left`** defines left-associative operators (e.g., `+`, `-`, `*`, `/`). When two operators of the same precedence appear, the parser reduces the left expression first.
- **`%right`** defines right-associative operators (e.g., `^`). An expression like `2 ^ 3 ^ 2` is parsed as `2 ^ (3 ^ 2)`.
- **`%nonassoc`** marks operators that cannot be repeated (e.g., comparison operators in some languages). Using `a < b < c` becomes a syntax error.
- **`%prec`** assigns a specific precedence to a grammar rule. This is essential for unary minus: the rule `'-' expr %prec UMINUS` tells Bison to use the precedence of the virtual symbol `UMINUS` instead of the binary `-` token.

In this project, these declarations correctly handle arithmetic expressions and eliminate all expected shift/reduce conflicts.

---

## Report 3：Team Collaboration Log

**Team:** Group 8
**Members:** Ye Haoxiang, Huang Shaojiang, Wu Fayang
**Project:** Scientific Calculator Parser using Flex and YACC/Bison

### 1. Team Roles

Ye Haoxiang was mainly responsible for grammar analysis and the YACC/Bison rules. Huang Shaojiang focused on the AST structure, semantic actions, and expression evaluation. Wu Fayang worked on Flex-Bison integration, test cases, and documentation checking.

### 2. Meeting Records

#### Meeting 1: Grammar Design and Project Structure

**Time:** May 25, 2026, 10:30–11:10

**Agenda:**
1. Review the requirements of Lab 2.
2. Decide how to reuse the lexer from Lab 1.
3. Design the first version of the Bison grammar.
4. Discuss how to represent the syntax tree.

**Decisions:**
We decided to reuse the Lab 1 lexer as the token provider. The parser would focus on grammar rules, AST construction, and expression evaluation. We also decided to use a general `Node` structure (with `NodeKind` enum) to represent numbers, identifiers, binary operators, unary operators, functions, assignments, and memory operations.

#### Meeting 2: Conflict Analysis and Documentation Review

**Time:** May 25, 2026, 14:30–15:20

**Agenda:**
1. Run Bison on the initial grammar.
2. Check the `.output` file for conflicts.
3. Discuss operator precedence and associativity.
4. Review the English documentation draft.

**Decisions:**
We found that arithmetic expressions caused shift/reduce conflicts. The team discussed two solutions: rewriting the grammar into multiple precedence levels, or using Bison precedence declarations. We chose precedence declarations because they made the grammar shorter and clearer for this calculator project. We used `%left '+' '-'`, `%left '*' '/'`, `%right '^' POW`, and `%prec UMINUS` to resolve the main conflicts.

### 3. Grammar Conflict Discussion

The main grammar conflicts were related to expression parsing. For `2 + 3 * 4`, multiplication should have higher precedence than addition. For `10 - 3 - 2`, subtraction should be left-associative. For `2 ^ 3 ^ 2`, power should be right-associative. For `-5 - 3`, unary minus and binary minus needed to be distinguished. These conflicts were resolved through precedence and associativity declarations as described in the Design Report.

### 4. Peer Review of English Documentation

Each member reviewed one part of the English documentation. Ye Haoxiang checked the grammar explanation and conflict analysis sections. Huang Shaojiang reviewed the AST design and semantic action sections. Wu Fayang checked the testing section, English expressions, and overall formatting. We revised unclear descriptions and ensured all sections used consistent terminology.

### 5. Summary

Through this teamwork, we learned how Flex and Bison cooperate in a compiler front end. Flex recognizes tokens, while Bison organizes tokens into grammar structures and builds the AST through semantic actions. This lab helped us connect LALR parsing theory with a practical scientific calculator parser.

---

## Report 4：Design Report (3–4 pages)

### 1. Introduction

This project implements a scientific calculator parser using Flex and YACC/Bison. The lexer from Lab 1 is reused to recognize numbers, identifiers, operators, functions, constants, and memory commands. The main task of Lab 2 is to design the grammar, construct an Abstract Syntax Tree, resolve grammar conflicts, and evaluate expressions.

YACC/Bison was selected because it is closely related to the LALR parsing theory studied in this course. It also provides useful conflict reports and supports semantic actions, which are necessary for AST construction. Compared with modern alternatives such as ANTLR, Bison is more suitable for this lab because it directly demonstrates shift/reduce conflicts, precedence declarations, and Flex integration.

### 2. Grammar Design

The calculator grammar supports multiple statements separated by newlines or semicolons. Each statement can be an expression, an assignment, or a memory operation.

**Full BNF grammar:**

```
program      → ε | program statement terminator | program terminator
terminator   → NEWLINE | SEMICOLON

statement    → expr
             | ID '=' expr
             | MC
             | M_PLUS expr
             | M_MINUS expr

expr         → NUMBER
             | ID
             | PI
             | E
             | MR
             | expr '+' expr
             | expr '-' expr
             | expr '*' expr
             | expr '/' expr
             | expr '^' expr
             | expr POW expr
             | '-' expr          (with %prec UMINUS)
             | '(' expr ')'
             | SIN '(' expr ')'
             | COS '(' expr ')'
             | TAN '(' expr ')'
             | LOG '(' expr ')'
             | LN  '(' expr ')'
             | LOG10 '(' expr ')'
```

**Key design decisions:**

- The rule `statement → ID '=' expr` handles variable assignment. The identifier is stored in the symbol table during the semantic action.
- `MR` appears inside `expr` because it returns a numeric value (the current memory), making it semantically equivalent to a number.
- `M_PLUS` and `M_MINUS` are statement-level rules because they modify memory state and do not return values.
- Both `^` and `POW` are supported as exponentiation operators with the same semantics.

### 3. Conflict Analysis

The initial expression grammar caused shift/reduce conflicts because it used flat rules such as `expr → expr + expr` and `expr → expr * expr` without precedence declarations. For example, the input `2 + 3 * 4` could be parsed either as `(2 + 3) * 4` or `2 + (3 * 4)`.

To resolve these conflicts, the following precedence declarations were used:

```yacc
%left '+' '-'          /* lowest precedence, left-associative */
%left '*' '/'          /* higher precedence, left-associative */
%right '^' POW         /* highest binary precedence, right-associative */
%right UMINUS          /* unary minus, even higher precedence */
```

The declaration `%left '+' '-'` makes addition and subtraction left-associative. The declaration `%left '*' '/'` gives multiplication and division higher precedence because it appears later in the declaration list. The declaration `%right '^' POW` makes exponentiation right-associative so that `2 ^ 3 ^ 2` equals `2 ^ (3 ^ 2) = 512`. The rule `'-' expr %prec UMINUS` assigns a special precedence to unary minus, distinguishing it from binary subtraction.

After these declarations, Bison resolved all expected expression conflicts. The `.output` file was checked to confirm no unexpected conflicts remained.

### 4. AST Design

The parser constructs an Abstract Syntax Tree during parsing. Each grammar rule uses semantic actions to create AST nodes.

**Node types:**

| NodeKind | Content | Children |
|------|------|:--:|
| `NODE_NUMBER` | `double value` | 0 |
| `NODE_IDENTIFIER` | `char *name` | 0 |
| `NODE_BINARY` | `int operator` | 2 |
| `NODE_UNARY` | `int operator` | 1 |
| `NODE_FUNCTION` | `char *funcName` | 1 |
| `NODE_ASSIGN` | — | 2 (left: id, right: expr) |
| `NODE_MEMORY` | `int memOp` | 0–1 |

**Semantic actions example:**

```yacc
expr '+' expr    { $$ = ast_binary(OP_ADD, $1, $3); }
'-' expr %prec UMINUS  { $$ = ast_unary(OP_UMINUS, $2); }
SIN '(' expr ')' { $$ = ast_function("sin", $3); }
```

Values `$1` and `$3` are child AST nodes passed up from previous reductions. `$$` stores the newly created parent node. This is a direct implementation of synthesized attributes.

**Memory management:** `ast_free()` recursively releases left and right children before freeing the node itself. Dynamically allocated strings (identifier names, function names) are also freed.

### 5. Testing

| No. | Input | Expected AST | Expected Result | Function Tested |
|:--:|------|------|------|------|
| 1 | `(1 + 2) * 3` | `[* [+] 3]` | 9 | Parentheses and basic arithmetic |
| 2 | `sin(cos(0.5))` | `sin(cos(0.5))` | ≈ 0.7692 | Nested trigonometric functions |
| 3 | `2 ^ 3 * 4` | `[* [^ 2 3] 4]` | 32 | Power and multiplication precedence |
| 4 | `log10(100) + ln(e)` | `[+ log10(100) ln(e)]` | 3 | Logarithmic functions and constants |
| 5 | `x = 5; y = x + 2; y` | `=[y + [x] 2]` | 7 | Variable assignment and recall |
| 6 | `MC; M+ 10; M+ 5; MR * 2` | `[* MR 2]` | 30 | Memory operations |
| 7 | `0b1010 + 0x10 + 0o7` | `[+ + 10 16] 7]` | 33 | Number tokens from Lab 1 lexer |

### 6. Conclusion

**First**, the parser works for the required scientific calculator expressions. It can parse arithmetic expressions, functions, constants, variables, assignments, and memory operations. It also constructs and prints an AST before evaluating the expression.

**Second**, our grammar design hypothesis was mostly correct. The initial grammar was simple and readable, but it caused shift/reduce conflicts. After adding precedence and associativity declarations, the grammar produced the expected parse structure without ambiguity.

**Third**, we observed that LALR parsing is powerful but sensitive to ambiguous grammar rules. Bison's `.output` conflict report helped us understand exactly where ambiguity occurred and why. We also learned that semantic actions can construct AST nodes during reduction, implementing synthesized attributes in practice.

**Finally**, the main sources of errors were: (1) grammar conflicts from flat expression rules, (2) unary minus handling requiring `%prec UMINUS`, (3) Flex-Bison token integration requiring consistent `yylval` types, and (4) memory management for dynamically allocated identifier strings. These problems were solved by using precedence declarations, the `%prec` mechanism, correct `yylval` assignments in the lexer, and recursive AST freeing.

---

## Report 5：Test Case Package & ZIP Structure

### ZIP Package Structure

```
Group8_Lab2_YACC_Calculator.zip
│
├── src/
│   ├── calculator.l          # Flex lexer (reused from Lab 1)
│   ├── calculator.y          # Bison grammar + AST construction
│   ├── ast.h                 # AST node types and function declarations
│   ├── ast.c                 # AST construction, printing, evaluation, freeing
│   ├── symtab.h              # Symbol table declarations
│   └── symtab.c              # Symbol table and memory register implementation
│
├── test/
│   ├── test_cases.md         # Test case table (below)
│   ├── test1_basic.calc      # Basic arithmetic with parentheses
│   ├── test2_trig.calc       # Nested trigonometric functions
│   ├── test3_power.calc      # Power and multiplication precedence
│   ├── test4_log.calc        # Logarithmic functions
│   ├── test5_var.calc        # Variable assignment and reference
│   ├── test6_mem.calc        # Memory operations
│   └── test7_bases.calc      # Binary/octal/hex number tokens
│
├── docs/
│   ├── Tool_Survey.pdf
│   ├── Bison_Conflict_Summary.pdf
│   ├── Team_Collaboration_Log.pdf
│   └── Design_Report.pdf
│
├── Makefile
└── README.md
```

### Test Cases

| No. | Input | Expected AST Pattern | Expected Result |
|:--:|------|------|------|
| 1 | `(1 + 2) * 3` | root `[*]`, left child `[+]` | 9 |
| 2 | `sin(cos(0.5))` | root `sin`, child `cos` | ≈ 0.7692 |
| 3 | `2 ^ 3 * 4` | root `[*]`, left child `[^]` | 32 |
| 4 | `log10(100) + ln(e)` | root `[+]` | 3 |
| 5 | `x = 5; y = x + 2; y` | assignment + identifier nodes | 7 |
| 6 | `MC; M+ 10; M+ 5; MR * 2` | memory + multiplication nodes | 30 |
| 7 | `0b1010 + 0x10 + 0o7` | nested `[+]` tree | 33 |

### Submission Note

> All required files are included in the submitted ZIP package. Documentation files are in the `docs/` folder, source code files are in the `src/` folder, and test cases are in the `test/` folder. The `.y` and `.l` files contain English comments explaining every `%` declaration, grammar rule, and semantic action.
