---
tags: [编译原理, 实验, Yacc, Bison, AST, 冲突分析]
created: 2026-05-24
status: active
course: Lab 2 — Syntax Analysis with YACC/Bison
---

# Lab 2 — YACC/Bison 科学计算器语法分析

> Lab 1 走完词法分析（Flex lexer → token 流），Lab 2 的重心转向 **语法规则设计、AST 构造、冲突分析与解决、Flex-Bison 集成**。词法规则只是前端，真正的工程落在文法设计和语义动作上。

---

## 一、实验定位

| 维度       | 说明                                                                                          |
| -------- | ------------------------------------------------------------------------------------------- |
| **前置**   | [[编译原理/编译原理对话记录/编译原理：自底向上语法分析\|Lab 1]] 已完成词法分析——Flex 识别 token、输出 token 流                    |
| **重点**   | 文法工程、AST 构造、冲突分析与消解、Flex 和 Bison 的协作                                                        |
| **对应目标** | Objective 4：调研工具文档，比较 parser generator，用 Flex/YACC/Bison 构建分析器；Objective 5：英文文献阅读、技术写作、设计报告 |

### 内核总结

```
Lab 1 的 Flex lexer 作为前端
    ↓ 输出 token 流 (yylval)
Bison/YACC 的科学计算器文法
    ↓ 规约时执行 semantic action → 构造 AST
优先级声明 / 文法改写解决冲突
    ↓
输出语法树 + 计算结果
```

核心工作四块：
1. **文法设计**：算术、函数、常量、变量、内存操作
2. **AST 构造**：每条规则返回 `nodeType*`，实现 `printTree()`
3. **冲突分析**：先写无优先级的初版 → `bison -v` → 分析 ≥3 个冲突 → 用 `%left`/`%right`/`%prec` 解决 → `bison --report=all` 验证
4. **英文文档**：Design Report、Conflict Analysis、Tool Survey、Team Log

---

## 二、功能需求

### 2.1 表达式语法

| 类别   | 运算符 / 函数                             | 说明             |
| ---- | ------------------------------------ | -------------- |
| 基本算术 | `+` `-` `*` `/` `( )` 一元负号           | 四则运算 + 括号分组    |
| 三角函数 | `sin(expr)` `cos(expr)` `tan(expr)`  | 参数按弧度处理        |
| 指数与幂 | `^` `**`                             | 幂运算，通常**右结合**  |
| 对数   | `log(expr)` `ln(expr)` `log10(expr)` | 自然对数与常用对数      |
| 常量   | `PI` `e`                             | 数学常量           |
| 变量赋值 | `id = expr`                          | 例如 `x = 5`     |
| 变量引用 | 表达式中使用已赋值的 id                        | 例如 `y = x + 2` |

### 2.2 内存操作

| token | 含义 |
|-------|------|
| `MC` | Memory Clear — 清空内存 |
| `MR` | Memory Recall — 读取内存值 |
| `M+ expr` | Memory Add — `memory += expr` |
| `M- expr` | Memory Subtract — `memory -= expr` |

> ⚠️ Lexer 必须区分 `MR` 和 `M_PLUS`（`M+`）。不能把 `M+ 5` 误解析为 `MR + 5`。

### 2.3 数字进制

Lab 1 已支持二进制、八进制、十六进制。Lab 2 中这些数字继续作为 `NUMBER` token 被 parser 接收，**文法层不需要再做进制转换**——lexer 已经返回了数值。

---

## 三、AST 设计

### 3.1 节点类型

| 节点类型               | 存储内容                     |      子节点       |
| ------------------ | ------------------------ | :------------: |
| **常量节点** (ConstK)  | `double value`           |       0        |
| **标识符节点** (IdK)    | `char *name`             |       0        |
| **运算符节点** (OpK)    | `int operator`           |      1-2       |
| **函数节点** (FuncK)   | `char *funcName`         |     1（参数）      |
| **赋值节点** (AssignK) | —                        | 2（左 id，右 expr） |
| **内存操作节点** (MemK)  | `int memOp`（MC/MR/M+/M-） |      0-1       |

### 3.2 Bison 语义值类型

利用 [[编译原理/Yacc与LALR(1)|Yacc 的 %union 机制]]：

```yacc
%union {
    double      dval;       /* NUMBER, PI, e */
    char       *sval;       /* ID */
    nodeType   *nval;       /* 所有非终结符的 AST 节点 */
}

%token <dval> NUMBER
%token <sval> ID
%token <dval> PI E
%type  <nval> expr stmt
```

所有非终结符（`expr`、`stmt`、`term` 等）都声明为 `%type <nval>`，确保每次规约返回 `nodeType*`。

### 3.3 语义动作构造 AST

```yacc
expr : expr '+' expr
    {
        $$ = newOpNode(OP_ADD, $1, $3);
    }
    | '-' expr %prec UMINUS
    {
        $$ = newOpNode(OP_UMINUS, $2, NULL);
    }
    | SIN '(' expr ')'
    {
        $$ = newFuncNode("sin", $3);
    }
    ;
```

每条约定的语义动作就是一次归约时的 AST 构造——这正是 [[编译原理/关系图谱-节点内容/综合属性|综合属性]]思想在 Yacc 中的实现：子节点的 `nodeType*`（`$1`、`$3`）传给父节点（`$$`）。

### 3.4 AST 打印

```c
void printTree(nodeType *node, int indent) {
    // 递归输出缩进树
    // 对于 OpK 节点：先打印运算符，再递归打印左右子
    // 对于 FuncK 节点：打印函数名 + 参数
    // 可选：输出 Graphviz DOT 格式，可视化语法树
}
```

---

## 四、冲突分析（重点）

### 4.1 为什么要先写"有冲突的文法"

不是让 Bison 别报错就完了。是要**故意写出有歧义的文法**，理解冲突在哪里、为什么产生、如何消解。这正是 [[编译原理/LR系列对比总览|LALR(1) 的理论知识]]在工程中的直接应用。

### 4.2 标准流程

```
1. 写初版文法：包含所有运算符，不写 %left/%right/%nonassoc/%prec
2. bison -v → 生成 .output 文件
3. 从 .output 找出 ≥3 个冲突（shift/reduce 或 reduce/reduce）
4. 对每个冲突记录：
   - State number
   - Lookahead token
   - 冲突的规则
   - 冲突原因（优先级不明？结合性不明？一元/二元混淆？）
5. 消解冲突：
   - %left/%right/%nonassoc 声明优先级和结合性
   - %prec UMINUS 给一元负号设置特殊优先级
   - 必要时改写文法
6. bison --report=all → 确认无非预期冲突
```

### 4.3 典型冲突来源

| 冲突示例 | 原因 | 解决 |
|----------|------|------|
| `expr + expr * expr` | 加法和乘法优先级不明 | `%left '+' '-'`; `%left '*' '/'`（`*` 优先级高于 `+`） |
| `expr - expr - expr` | 减法结合性不明 | `%left '-'` |
| `- expr` vs `expr - expr` | 一元负号和二元减号混淆 | `%right UMINUS`; 加 `%prec UMINUS` |
| `expr ^ expr ^ expr` | 幂运算结合性 | `%right '^'`（幂运算右结合：`a^b^c = a^(b^c)`） |
| `MR + 5` vs `M+ 5` | Lexer 需要区分 MR 和 M_PLUS | 词法规则中 `M+` 返回 `M_PLUS` token |

### 4.4 与 LALR(1) 理论的关系

Yacc/Bison 底层用的是 [[编译原理/LR系列对比总览|LALR(1) 算法]]。当 LALR(1) 分析表中出现 shift/reduce 冲突时，Yacc 的默认行为是**优先 shift**（这就是为什么悬挂 else 能自动处理）。但对于算术表达式，默认的 shift 优先会导致错误的结合性（例如 `a - b - c` 变成 `a - (b - c)`），所以必须显式声明 `%left` 来覆盖默认行为。

这就是 [[编译原理/Yacc与LALR(1)|Yacc 歧义消除机制]]在表达式文法中的具体形式。

---

## 五、推荐文法层次

```yacc
%left '+' '-'
%left '*' '/'
%right '^' POW
%right UMINUS           /* 一元负号的虚拟优先级 */

%%

expr:
    NUMBER              { $$ = newConstNode($1); }
  | ID                  { $$ = newIdNode($1); }
  | PI                  { $$ = newConstNode(M_PI); }
  | E                   { $$ = newConstNode(M_E); }
  | expr '+' expr       { $$ = newOpNode(OP_ADD, $1, $3); }
  | expr '-' expr       { $$ = newOpNode(OP_SUB, $1, $3); }
  | expr '*' expr       { $$ = newOpNode(OP_MUL, $1, $3); }
  | expr '/' expr       { $$ = newOpNode(OP_DIV, $1, $3); }
  | expr '^' expr       { $$ = newOpNode(OP_POW, $1, $3); }
  | expr POW expr       { $$ = newOpNode(OP_POW, $1, $3); }
  | '-' expr %prec UMINUS { $$ = newOpNode(OP_UMINUS, $2, NULL); }
  | '(' expr ')'        { $$ = $2; }
  | SIN '(' expr ')'    { $$ = newFuncNode("sin", $3); }
  | COS '(' expr ')'    { $$ = newFuncNode("cos", $3); }
  | TAN '(' expr ')'    { $$ = newFuncNode("tan", $3); }
  | LOG '(' expr ')'    { $$ = newFuncNode("log", $3); }
  | LN '(' expr ')'     { $$ = newFuncNode("ln", $3); }
  | LOG10 '(' expr ')'  { $$ = newFuncNode("log10", $3); }
  | MR                  { $$ = newMemNode(MEM_RECALL); }
  ;

stmt:
    expr                { /* 纯表达式：打印结果 */ }
  | ID '=' expr         { $$ = newAssignNode($1, $3); }
  | MC                  { $$ = newMemNode(MEM_CLEAR); }
  | M_PLUS expr         { $$ = newMemNode(MEM_ADD, $2); }
  | M_MINUS expr        { $$ = newMemNode(MEM_SUB, $2); }
  ;
```

> ⚠️ 这只是设计方向。实际实现时要匹配 Lab 1 lexer 的 token 名称和 `yylval` 类型。

---

## 六、符号表与内存设计

### 6.1 符号表 (symtab.h/c)

```
变量表：哈希表或链表
  - insert(name, value)
  - lookup(name) → value or error
  - 用于 id = expr 赋值 和 表达式中引用变量
```

### 6.2 内存 (calculator memory)

```c
double memory;   // 全局变量，独立于符号表

void mc()  { memory = 0; }
void mp(double val) { memory += val; }
void mm(double val) { memory -= val; }
double mr() { return memory; }
```

内存是单独的寄存器，不是符号表的一部分。`MC`/`M+`/`M-`/`MR` 都操作这块内存。

---

## 七、推荐项目结构

```
lab2-scientific-calculator/
├── calculator.l          # 复用 Lab 1 lexer + Bison 集成
├── calculator.y          # Bison 文法 + AST 构造
├── ast.h / ast.c         # AST 节点类型、构造/释放/打印函数
├── symtab.h / symtab.c   # 符号表 + 内存寄存器
├── Makefile              # 一键构建 (flex → bison → gcc)
├── test/
│   ├── test1_basic.in         # 带括号的基本算术
│   ├── test2_trig.in          # 嵌套三角函数
│   ├── test3_power.in         # 幂和乘法混合
│   ├── test4_log.in           # 对数链
│   ├── test5_var.in           # 变量赋值和引用
│   ├── test6_mem.in           # 内存操作序列
│   └── expected/              # 预期 AST + 预期结果
└── docs/
    ├── Tool_Survey.pdf        # 工具调研报告
    ├── Design_Report.pdf      # 3-4 页英文设计报告
    ├── Conflict_Analysis.pdf  # 冲突分析报告
    └── Team_Collaboration_Log.pdf
```

---

## 八、测试用例

| # | 输入 | 预计结果 | 测试类别 |
|:--:|------|----------|----------|
| 1 | `(3 + 4) * 2` | `14` | 括号 + 基本算术 |
| 2 | `sin(cos(0.5))` | `sin(cos(0.5))` | 嵌套三角函数 |
| 3 | `2 ^ 3 * 4` | `32`（即 (2³)×4） | 幂运算优先级 |
| 4 | `log10(100) + ln(e)` | `3`（即 2 + 1） | 对数链 |
| 5 | `x = 5; y = x + 2; y` | `7` | 变量赋值与引用 |
| 6 | `MC; M+ 10; M+ 5; MR * 2` | `30` | 内存操作序列 |

---

## 九、英文报告提纲

### Design Report

| Section | Content |
|---------|---------|
| **Introduction** | Problem statement; why YACC/Bison was chosen; relation to [[编译原理/LR系列对比总览|LALR theory]] |
| **Grammar Design** | Full BNF grammar; key production rules explained; precedence declarations rationale |
| **Conflict Analysis** | State numbers, lookahead tokens, competing rules, root causes, resolution strategies (see [[#四、冲突分析（重点）|Section 4]]) |
| **AST Design** | Node structure, `%union`/`%type` declarations, memory management, `printTree()` algorithm |
| **Testing** | Test cases and actual vs. expected results |
| **Conclusion** | Parser correctness; grammar hypothesis validation; [[编译原理/Yacc与LALR(1)|LALR parsing]] observations; error sources (conflicts, integration bugs, semantic action errors) |

### Conflict Analysis Report

每个冲突的标准格式：

```
Conflict #1
  State: 42
  Lookahead: '+'
  Competing rules:
    - Shift: expr → expr '+' · expr
    - Reduce: expr → expr '*' expr ·
  Cause: Addition and multiplication have no relative precedence.
  Resolution: Declare %left '*' '/' at higher precedence than %left '+' '-'.
```

---

## 十、关联节点索引

| 概念 | 笔记 |
|------|------|
| LALR(1) 理论 | [[编译原理/LR系列对比总览]] |
| Yacc 语法规则与语义动作 | [[编译原理/Yacc与LALR(1)]] |
| shift/reduce 冲突 | [[编译原理/关系图谱-节点内容/移进-归约冲突]] |
| reduce/reduce 冲突 | [[编译原理/关系图谱-节点内容/归约-归约冲突]] |
| 综合属性（`$$`/`$n` 的理论基础） | [[编译原理/关系图谱-节点内容/综合属性]] |
| S-属性文法的天然适应性 | [[编译原理/关系图谱-节点内容/S-属性文法]] |
| 属性文法三元组 | [[编译原理/关系图谱-节点内容/属性文法]] |
| ACTION/GOTO 表 | [[编译原理/关系图谱-节点内容/Action 表]] / [[编译原理/关系图谱-节点内容/Goto 表]] |
| 项目集规范族 | [[编译原理/关系图谱-节点内容/项目集规范族]] |
| Lab 1 词法分析 | [[编译原理/编译原理对话记录/编译原理：自底向上语法分析]] |
| 编译原理阶段总结 | [[编译原理/编译原理阶段总结]] |
