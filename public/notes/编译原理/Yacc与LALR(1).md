---
tags: [编译原理, 语法分析, Yacc, LALR, 实践]
created: 2026-05-24
updated: 2026-05-24
status: active
---

# Yacc 与 LALR(1)

> 从手写 LR 分析器到用 Yacc 自动生成 parser——LALR(1) 的形式化定义、Yacc 文件三部分、歧义消除、属性传递与错误恢复。

---

## 一、Yacc 是什么

**Yacc**（Yet Another Compiler Compiler）是一个 parser generator：

```
输入：.y 语法规格文件
输出：C 语言 LALR(1) parser（yyparse()）
```

它内部的工作流：

```
.y 文件 → Yacc → y.tab.c（含 LALR(1) 分析表 + 语义动作 C 代码）
```

Yacc 使用的分析算法是 **LALR(1)**——其定义详见 [[LR系列对比总览#四、LALR(1)：合并核心相同的 LR(1) 状态|LR 系列对比]]。

LALR(1) 的核心操作：先按 LR(1) 构造所有项目集，然后把**核心相同、仅 lookahead 不同**的状态合并为一个，lookahead 取并集。合并后状态数 = LR(0) 状态数，表规模接近 SLR(1)，但能力接近 LR(1)。

---

## 二、Yacc 文件的三部分结构

```yacc
%{
/* 第一部分：definitions —— C 声明、token 定义、类型 */
%}

%token NUM ID PLUS MINUS TIMES DIVIDE
%token IF THEN ELSE WHILE DO
%left PLUS MINUS
%left TIMES DIVIDE

%%
/* 第二部分：rules —— 文法规则 + 语义动作 */

%%
/* 第三部分：routines —— 辅助函数（yylex、yyerror、main） */
```

### 2.1 definitions 段的形式化内容

| 指令          | 含义                                | 示例                                 |
| ----------- | --------------------------------- | ---------------------------------- |
| `%token`    | 声明终结符（token），Yacc 自动为其分配编号        | `%token NUM ID`                    |
| `%left`     | 声明左结合运算符，**同时指定优先级**——写在越下面的优先级越高 | `%left PLUS MINUS`                 |
| `%right`    | 声明右结合运算符                          | `%right ASSIGN`                    |
| `%nonassoc` | 声明不可结合的运算符（如比较符连续出现时报错）           | `%nonassoc LT GT`                  |
| `%union`    | 定义属性值的 C 联合类型（`$$`、`$1` 等的类型）     | `%union { int ival; char *sval; }` |
| `%type`     | 给非终结符指定 union 中的字段类型              | `%type <ival> exp term factor`     |
| `%start`    | 指定开始符号（默认第一条规则的左部）                | `%start program`                   |

**优先级与结合性消除歧义的机制**：

Yacc 用 `%left`/`%right` 的声明顺序建立优先级链。当 LALR(1) 分析表出现 shift/reduce 冲突时，Yacc 自动按以下规则消解：

1. **shift 的 token 优先级 > 归约产生式的优先级 → shift**
2. **归约产生式的优先级 > shift 的 token → reduce**
3. 优先级相同 → 按结合性（`%left` = reduce，`%right` = shift）

其中某条产生式的优先级 = **该产生式右部最后一个终结符的优先级**。如果右部没有终结符，则无法用优先级消解。

> 这是 Yacc 相对纯理论 LALR(1) 的最大工程补充——理论上有冲突的文法，通过优先级声明可以安全使用。

### 2.2 rules 段的形式化定义

```
非终结符 : 右部1  { 语义动作1 }
         | 右部2  { 语义动作2 }
         ...
         ;
```

Yacc 符号约定：

| 符号 | 对应理论含义 |
|:--:|------|
| `:` | 文法中的 →（产生式的元符号） |
| `\|` | 同一左部的多条候选式 |
| `;` | 当前非终结符的全部规则结束 |
| `{ }` | 归约时执行的语义动作（C 代码块） |
| `/* */` | 注释 |

### 2.3 routines 段

```c
int yylex(void) {
    // 词法分析器：每次调用返回一个 token 编号
    // token 编号由 Yacc 在 y.tab.h 中定义（如 #define NUM 257）
}
int yyerror(char *s) {
    fprintf(stderr, "parse error: %s\n", s);
    return 0;
}
int main(void) {
    return yyparse();   // Yacc 生成的入口函数
}
```

**yylex 和 yyparse 的协作机制**：`yyparse()` 在需要下一个 token 时调用 `yylex()`。`yylex()` 的返回值是 token 编号（`%token` 声明时 Yacc 自动分配）。`yylval` 是全局变量，`yylex()` 在返回前把当前 token 的属性值赋给它，供语义动作中的 `$n` 引用。

---

## 三、语义动作与属性传递

每个产生式的语义动作在**归约发生的那一刻**执行。属性通过 `$$` 和 `$n` 引用：

| 符号 | 理论对应 | 含义 |
|:--:|------|------|
| `$$` | 综合属性 of LHS | 产生式**左部**非终结符的属性值 |
| `$1` | X₁.a | 右部第 1 个符号的属性值 |
| `$n` | Xₙ.a | 右部第 n 个符号的属性值 |
| `$0` | — | 归约发生前栈中位于右部符号之前的符号属性（不常用） |

示例——**Yacc 中的 [[综合属性|综合属性]]传递即 [[属性文法|属性文法]]的语义方程**：

```
exp₁ → exp₂ + term
  exp₁.val = exp₂.val + term.val
```

对应 Yacc：

```yacc
exp : exp PLUS term    { $$ = $1 + $3; }
    | term             { $$ = $1; }
    ;
```

> `$$` 对应 `exp₁.val`，`$1` 对应 `exp₂.val`，`$3` 对应 `term.val`。

**语法树构造的语义动作**：

```yacc
write_stmt : WRITE exp
    {
        $$ = newStmtNode(WriteK);    /* 创建新节点 */
        $$->child[0] = $2;           /* 把 exp 节点链为第一个子节点 */
    }
    ;
```

---

## 四、Yacc 中的歧义消除

### 4.1 经典的 if-else 悬挂歧义

文法本身有二义性：

```
if_stmt : IF expr THEN stmt
        | IF expr THEN stmt ELSE stmt
        ;
```

Yacc 的默认行为：遇到 shift/reduce 冲突时 **优先 shift**（即把 `ELSE` 匹配给最近的 `IF`）。这恰好实现了大多数语言期望的"else 与最近未匹配的 if 配对"语义。不需要额外指定。

### 4.2 运算符优先级与结合性

四则运算的歧义问题：`a + b * c` 可以被解析为 `(a + b) * c` 或 `a + (b * c)`。Yacc 通过 `%left`/`%right` 消除：

```yacc
%left PLUS MINUS        /* 低优先级，左结合 */
%left TIMES DIVIDE      /* 高优先级，左结合 */
```

`TIMES` 优先级 > `PLUS` 优先级，所以 `a + b * c` 中的 `*` 比 `+` 更"粘"，结果自然归约为 `a + (b * c)`。

---

## 五、错误恢复机制

Yacc 提供特殊的伪 token `error` 和宏 `yyerrok`：

### error 的用法

```yacc
stmt_list : stmt_list stmt
          | error '\n'    { yyerrok; }
          ;
```

解释：当 parser 在 `stmt_list` 状态遇到语法错误时：
1. 不断弹出栈直到进入一个接受 `error` 的状态
2. 丢弃输入符号直到看到一个 `\n`
3. 把 `error` 当作成功匹配的符号压栈
4. `yyerrok` 告诉 Yacc "我已经处理完这个错误了，可以继续正常分析"

### 为什么要做错误恢复

| 不恢复 | 恢复 |
|--------|------|
| 遇到第一个语法错误就停止 | 跳过错行，继续分析后续程序 |
| 只报一个错误 | 可以报告多个错误（更好调试） |
| 用户见一个改一个 | 一次编译看到所有错误 |

**error token 的匹配条件**：Yacc 不会在任何状态下都接受 `error`。只有在文法中**显式写了 `error` 候选式**的规则里，parser 才会把 `error` 视为合法输入来尝试恢复。如果当前状态没有接受 `error` 的规则，parser 依然会报错并无法恢复。

---

## 六、Yacc 与 LALR(1) 底层机制总结

| 层次 | 内容 |
|------|------|
| **文法转 DFA** | Yacc 内部按 LR(1) 构造项目集，核心相同的合并为 LALR(1) 状态 |
| **冲突消解** | shift/reduce 冲突按优先级+结合性自动处理；reduce/reduce 冲突报错 |
| **分析循环** | `yyparse()` 循环调用 `yylex()` 取 token，查 LALR(1) 分析表，执行 shift/reduce |
| **属性计算** | 归约时执行 `{ }` 中的 C 代码，通过 `$$`/`$n` 传递综合属性 |

---

## 关联笔记

- [[LR系列对比总览]] — LALR(1) 的形式化定义与合并算法
- [[语义分析与属性文法]] — 综合/继承属性的理论定义
- [[依赖图与属性计算]] — 属性计算的拓扑排序
- [[Action 表]]
- [[Goto 表]]
- [[移进-归约冲突]]
- [[归约-归约冲突]]
- [[编译原理阶段总结]]
