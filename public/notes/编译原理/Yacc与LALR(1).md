---
tags: [编译原理, 语法分析, Yacc, LALR, 实践]
created: 2026-05-24
status: active
---

# Yacc 与 LALR(1)

> 从手写 LR 分析器到用 Yacc 自动生成 parser 的实践跨越。

---

## 一、Yacc 是什么

Yacc（Yet Another Compiler Compiler）是语法分析器生成器。

| 输入 | 输出 |
|------|------|
| `.y` 语法规则文件 | C 语言 parser 代码 |

核心：不再手写完整 LR 分析器，而是写规格文件，让工具自动生成。

Yacc 内部使用 **LALR(1)** 分析算法 —— 能力接近 LR(1)，表规模接近 SLR(1)。

---

## 二、Yacc 文件三部分

```
definitions    ← 第一部分：声明
%%
rules          ← 第二部分：规则
%%
routines       ← 第三部分：辅助函数
```

### 第一部分：definitions

```yacc
%token NUM ID IF THEN ELSE
%token PLUS MINUS TIMES DIVIDE

%union {
    int ival;
    char *sval;
}
```

写 token 声明、类型定义、C 头文件等。

### 第二部分：rules

```yacc
exp : exp PLUS term     { $$ = $1 + $3; }
    | term              { $$ = $1; }
    ;

term : term TIMES factor { $$ = $1 * $3; }
     | factor            { $$ = $1; }
     ;
```

Yacc 符号约定：

| 符号 | 含义 |
|:--:|------|
| `:` | 文法中的 `→` |
| `\|` | 或者 |
| `;` | 本条规则结束 |
| `{ }` | 语义动作（C 代码） |

### 第三部分：routines

```c
int yylex(void) { /* 词法分析器 */ }
int yyerror(char *s) { fprintf(stderr, "%s\n", s); }
int main(void) { return yyparse(); }
```

---

## 三、语义动作中的属性引用

Yacc 归约时执行 C 代码，通过 `$$` 和 `$n` 访问属性：

```yacc
write_stmt : WRITE exp
    {
        $$ = newStmtNode(WriteK);
        $$->child[0] = $2;
    }
    ;
```

| 符号 | 含义 |
|:--:|------|
| `$$` | 产生式**左部**的属性值 |
| `$1` | 右部第 1 个符号的属性值 |
| `$2` | 右部第 2 个符号的属性值 |
| `$n` | 右部第 n 个符号的属性值 |

本质：**属性文法的工程实现**。`$$ = $1 + $3` 就是属性方程 `exp.val = exp.val + term.val` 的代码化。

---

## 四、错误恢复

Yacc 提供特殊 token `error` 用于错误恢复：

```yacc
command : exp
        | error '\n'   { yyerrok; }
        ;
```

含义：如果当前命令出错，丢弃输入直到换行符，再继续分析。

| 目标 | 说明 |
|------|------|
| 不要一错就停 | 尽量继续分析后面的程序 |
| 避免连锁错误 | 跳过当前错误语句，尝试恢复 |
| `yyerrok` | 通知 Yacc 错误已处理，可以继续 |

---

## 关联笔记

- [[编译原理/LR系列对比总览]]
- [[编译原理/语义分析与属性文法]]
- [[编译原理/编译原理阶段总结]]
