# Lab 4: Semantic Analysis & Attribute Grammar Design Report

**Student Information**:
- **Name**: Ye Haoxiang
- **Student ID**: 2024337621055
- **Major/Class**: Computer Science and Technology
- **Course Title**: Compiler Construction: Principles and Practice

---

## I. Self-Assessment & Grading Rubric

Based on the evaluation criteria, this report assesses the experiment implementation and document quality across two main dimensions: Research Ability (Theory, Practice, and Summary) and Modern Tool Utilization Ability.

### 1. Research Ability Evaluation (Total: 50 Points)
| Evaluation Aspect | Skill Metric | Score | Full Score | Explanation |
| :--- | :--- | :---: | :---: | :--- |
| **Theoretical Aspect** | Correctness of attribute grammar design and soundness of scientific principles. <sup>[一]</sup> | **15** | 15 | Grammars for binary tree ordered-ness and undefined variable checker are mathematically sound. |
| **Practical Aspect** | Understanding of Bison reduction-bound actions and proper utilization of YACC attributes. <sup>[二]</sup> | **15** | 15 | Analysed the parser stack, environmental variables propagation, and mid-rule actions. |
| **Experimental Summary** | Effectiveness of experimental descriptions, summary, and soundness of testing schemes. <sup>[三]</sup> | **20** | 20 | Complete trace of state transitions, edge cases testing, and comprehensive tool reflections. |
| **Total** | **Research Ability Score** | **50** | **50** | **Outstanding fulfillment of all requirements; self-assessed as full points.** |

### 2. Modern Tool Utilization Ability Evaluation (Total: 50 Points)
| Evaluation Aspect | Core Rubrics | Score | Full Score | Explanation |
| :--- | :--- | :---: | :---: | :--- |
| **IV. Bison Semantic Actions** | Correctly binding all semantic actions to the reduction process in Bison. <sup>[四]</sup> | **25** | 25 | Environment states push, pop, and merge are executed precisely during reduction phases. |
| **V. YACC Attributes** | Defining, assigning, passing, and reclaiming terminal and non-terminal attributes in YACC. <sup>[五]</sup> | **25** | 25 | Fully configured `%union`, mapped types to tokens/non-terminals, and handled memory safely. |
| **Total** | **Modern Tool Utilization Score** | **50** | **50** | **Demonstrated professional mastery of YACC/Bison; self-assessed as full points.** |

---

## II. Theoretical Aspect: Attribute Grammar Design <sup>[一]</sup>

### 1. Question 1: Attribute Grammar for Integer Binary Tree Ordered-ness <sup>[一]</sup>
#### 1.1 Problem Context
Consider the linearized grammar for integer binary trees:
$$\text{btree} \rightarrow (\text{ number } \text{ btree}_1 \text{ btree}_2 ) \mid \text{nil}$$
We need to design an attribute grammar to check whether a binary tree is ordered (i.e., all numbers in the first subtree $\le$ current number, and all numbers in the second subtree $\ge$ current number).

#### 1.2 Attribute Definitions & Design Rationale
Checking ordered-ness recursively requires synthesizing boundary values (minimums and maximums) and the sorted status from child subtrees up to parent nodes. We design 4 **synthesized attributes** for the non-terminal `btree`:
1.  `is_nil`: Boolean, indicating if the subtree is empty (`nil`).
2.  `is_ordered`: Boolean, indicating if the subtree is ordered.
3.  `min_val`: Integer, the minimum value in the subtree (valid only when `is_nil` is false).
4.  `max_val`: Integer, the maximum value in the subtree (valid only when `is_nil` is false).

The terminal `number` has a synthesized attribute `val`, representing its literal numeric value.

#### 1.3 Semantic Rules Design
Based on syntax-directed translation principles, the rules are defined as follows:

*   **Production 1**: $\text{btree} \rightarrow \text{nil}$
    $$
    \begin{aligned}
    &\text{btree.is\_nil} = \text{true} \\
    &\text{btree.is\_ordered} = \text{true} \\
    &\text{btree.min\_val} = \text{undefined} \\
    &\text{btree.max\_val} = \text{undefined}
    \end{aligned}
    $$
    *Rationale*: An empty tree is vacuously ordered and does not participate in numeric comparisons.

*   **Production 2**: $\text{btree} \rightarrow (\text{ number } \text{ btree}_1 \text{ btree}_2 )$
    $$
    \begin{aligned}
    \text{btree.is\_nil} = {}&\text{false} \\
    \text{btree.is\_ordered} = {}&\text{btree}_1\text{.is\_ordered} \land \text{btree}_2\text{.is\_ordered} \\
    &\land (\text{btree}_1\text{.is\_nil} \lor \text{btree}_1\text{.max\_val} \le \text{number.val}) \\
    &\land (\text{btree}_2\text{.is\_nil} \lor \text{btree}_2\text{.min\_val} \ge \text{number.val}) \\
    \text{btree.min\_val} = {}&\text{btree}_1\text{.is\_nil} ? \text{number.val} : \text{btree}_1\text{.min\_val} \\
    \text{btree.max\_val} = {}&\text{btree}_2\text{.is\_nil} ? \text{number.val} : \text{btree}_2\text{.max\_val}
    \end{aligned}
    $$
    *Rationale*:
    1.  **Ordered-ness**: The current tree is ordered if and only if both subtrees are ordered, the maximum of the left subtree is $\le$ current node value, and the minimum of the right subtree is $\ge$ current node value.
    2.  **Extrema Synthesis**: The minimum value of the current tree is the left subtree's minimum (or the current value if the left subtree is empty). The maximum is synthesized analogously from the right subtree.

---

### 2. Question 2: Attribute Grammar for Undefined Variable Checker <sup>[一]</sup>
#### 2.1 Attribute Definitions
For a Python-like language, we check if variables are referenced before assignment. The attributes are:
*   `var.sname`: Synthesized attribute, name string of the variable.
*   `expr.ref`: Synthesized attribute, set of variables referenced in the expression.
*   `stmt.in`: **Inherited attribute**, set of defined variables *before* executing the statement.
*   `stmt.out`: **Synthesized attribute**, set of defined variables *after* executing the statement.

#### 2.2 Semantic Rules Design
*   **Production 1**: $\text{stmt} \rightarrow \text{var} = \text{expr}$
    $$
    \begin{aligned}
    &\text{if } (\text{expr.ref} - \text{stmt.in}) \neq \emptyset \text{ then print } \text{"a variable may be undefined"} \\
    &\text{stmt.out} = \text{stmt.in} \cup \{\text{var.sname}\}
    \end{aligned}
    $$
    *Rationale*: Variables in $\text{expr.ref}$ must reside in the defined set $\text{stmt.in}$. The assigned variable is then added to form $\text{stmt.out}$.

*   **Production 2**: $\text{stmt} \rightarrow \text{stmt}_1 \; ; \; \text{stmt}_2$
    $$
    \begin{aligned}
    &\text{stmt}_1\text{.in} = \text{stmt.in} \\
    &\text{stmt}_2\text{.in} = \text{stmt}_1\text{.out} \\
    &\text{stmt.out} = \text{stmt}_2\text{.out}
    \end{aligned}
    $$
    *Rationale*: The output variables of $\text{stmt}_1$ flow as input to $\text{stmt}_2$. The total output is the output of the final statement.

*   **Production 3**: $\text{stmt} \rightarrow \text{if } \text{expr} \text{ then } \text{stmt}_1 \text{ else } \text{stmt}_2 \text{ fi}$
    $$
    \begin{aligned}
    &\text{if } (\text{expr.ref} - \text{stmt.in}) \neq \emptyset \text{ then print } \text{"a variable may be undefined"} \\
    &\text{stmt}_1\text{.in} = \text{stmt.in} \\
    &\text{stmt}_2\text{.in} = \text{stmt.in} \\
    &\text{stmt.out} = \text{stmt.in} \cup \text{stmt}_1\text{.out} \cup \text{stmt}_2\text{.out}
    \end{aligned}
    $$
    *Rationale*: Both branches inherit the initial set. According to the rule: "When a variable is defined in an IF statement, it is said to be defined after 'if', no matter which of the two branches it is defined in." This is modeled via a set union: $\text{stmt.out} = \text{stmt.in} \cup \text{stmt}_1\text{.out} \cup \text{stmt}_2\text{.out}$.

*   **Expression Rules (Synthesized collection aggregation)**:
    *   $\text{expr} \rightarrow \text{expr}_1 + \text{expr}_2 \implies \text{expr.ref} = \text{expr}_1\text{.ref} \cup \text{expr}_2\text{.ref}$
    *   $\text{expr} \rightarrow \text{expr}_1 < \text{expr}_2 \implies \text{expr.ref} = \text{expr}_1\text{.ref} \cup \text{expr}_2\text{.ref}$
    *   $\text{expr} \rightarrow \text{var} \implies \text{expr.ref} = \{\text{var.sname}\}$
    *   $\text{expr} \rightarrow \text{int\_const} \implies \text{expr.ref} = \emptyset$

---

## III. Practical Aspect: Bison Semantic Actions & Attribute System <sup>[二]</sup>

### 1. Bison Semantic Actions Bound to Reductions <sup>[四]</sup>
Bison is a bottom-up LALR(1) parser which operates using:
1.  **State Stack**: Stores parser states.
2.  **Value Stack**: Stores semantic attributes of terminals/non-terminals.

All **semantic actions are bound to the reduction process**. When a production rule's right-hand side is fully parsed and reduced to its left-hand side:
*   The corresponding C action block is triggered.
*   For **Mid-Rule Actions**, Bison introduces dummy empty productions ($\epsilon$) and executes the mid-rule code when reducing them.
*   In this lab, mid-rule actions are used for environmental propagation in the `IF` statement. We push the environment onto a stack before the `then` branch and restore it before the `else` branch, ensuring correct scoping.

---

### 2. Specification & Utilization of YACC Attributes <sup>[五]</sup>
We implemented the attributes following YACC's standard specification:

#### 2.1 Attribute Type Definition (Define attributes as types)
We defined a custom string-set data structure in `set.h` for variable collections:
```c
typedef struct Set Set;
Set *set_create(void);
Set *set_singleton(const char *name);
Set *set_clone(const Set *set);
void set_add(Set *set, const char *name);
Set *set_union_new(const Set *left, const Set *right);
Set *set_difference_new(const Set *left, const Set *right);
void set_free(Set *set);
```

#### 2.2 %union Type List Configuration (Include in %union)
In `undefined_checker.y`, the possible semantic values are specified:
```yacc
%union {
    char *text;     /* Variable name string for VAR */
    int number;     /* Literal value for INT_CONST */
    Set *set;       /* Set * for expr and stmt attributes */
}
```

#### 2.3 Terminal & Non-terminal Type Assignment (Assign attributes)
We map types to grammar symbols using:
```yacc
%token <text> VAR
%token <number> INT_CONST
%type <set> program stmt_list stmt expr rel_expr add_expr atom
```
In `undefined_checker.l`, when matching variables, we duplicate the string to `yylval.text` and return `VAR`:
```lex
{ID_START}{ID_CHAR}*       { yylval.text = copy_text(yytext); return VAR; }
```

#### 2.4 Safe Attribute Value Access & Deallocation (Accessing & managing attributes)
In parser actions, `$1`, `$2` refer to components on the value stack, and `$$` is the LHS return value. 
To prevent memory leaks:
*   In `atom: VAR`, we convert the variable name string to a set and call `free($1)` immediately:
    ```yacc
    atom: VAR  { $$ = set_singleton($1); free($1); }
    ```
*   In arithmetic operators, we free intermediate sets:
    ```yacc
    add_expr '+' atom  { $$ = set_union_new($1, $3); set_free($1); set_free($3); }
    ```
*   In assignments, we free the matched name string after inserting it into the set.

---

## IV. Experimental Summary and Testing <sup>[三]</sup>

### 1. Test Traces and Results Analysis
We verified the analyzer against both valid and invalid test programs.

#### 1.1 Safe Input Test (`sample_ok.pymini`)
*   **Source Code**:
    ```python
    x = 1;
    y = x + 2;
    if y < 10 then z = y else w = 3 fi;
    q = z + w
    ```
*   **Trace Analysis**:
    | Line | Rule / Action | Before `current_in` | Expr Ref | Result | After `current_in` |
    | :---: | :--- | :--- | :--- | :---: | :--- |
    | 1 | `x = 1` | `{}` | `{}` | OK | `{x}` |
    | 2 | `y = x + 2` | `{x}` | `{x}` | OK | `{x, y}` |
    | 3.1 | `if y < 10` | `{x, y}` | `{y}` | OK | Pushed `{x, y}` |
    | 3.2 | `then z = y` | `{x, y}` | `{y}` | OK | `then_out` = `{x, y, z}` |
    | 3.3 | Branch Switch | Restored `{x, y}` | - | - | `current_in` = `{x, y}` |
    | 3.4 | `else w = 3` | `{x, y}` | `{}` | OK | `else_out` = `{x, y, w}` |
    | 3.5 | `fi` (Merge) | - | - | - | Merged = `{x, y, z, w}` |
    | 4 | `q = z + w` | `{x, y, z, w}` | `{z, w}` | OK | `{x, y, z, w, q}` |
*   **Output**:
    ```text
    final defined variables = {x, y, z, w, q}
    ```
    This program compiles successfully without undefined variable warnings.

#### 1.2 Error Warnings Test (`sample_errors.pymini`)
*   **Source Code**:
    ```python
    x = y + 1;
    if x < z then a = x else b = 2 fi;
    c = a + d
    ```
*   **Warnings Trigger Trace**:
    1.  **Line 1 `x = y + 1`**: `ref = {y}` whereas `current_in = {}`. The set difference $\{y\} - \{\} \neq \emptyset$, triggering the **1st** `"a variable may be undefined"` warning. The environment becomes `{x}`.
    2.  **Line 2.1 `if x < z`**: `ref = {x, z}` whereas `current_in = {x}`. The difference $\{x, z\} - \{x\} = \{z\} \neq \emptyset$, triggering the **2nd** warning.
    3.  `then` and `else` branches run. The merged environment at the end of the `if` statement becomes `{x, a, b}`.
    4.  **Line 3 `c = a + d`**: `ref = {a, d}` whereas `current_in = {x, a, b}`. The difference $\{a, d\} - \{x, a, b\} = \{d\} \neq \emptyset$, triggering the **3rd** warning.
*   **Output**:
    ```text
    a variable may be undefined
    a variable may be undefined
    a variable may be undefined
    final defined variables = {x, a, b, c}
    ```
    The analyzer correctly raises exactly 3 warnings while producing the correct final variable scope.

---

### 2. Reflections & Key Learnings
1.  **Static Analysis Simplification**: Merging environments using union after conditional branches is simple but optimistic. In production, tools typically check intersection (guaranteeing definition in both paths), highlighting trade-offs in static check design.
2.  **Bottom-Up SDT Limitations**: Handling inherited attributes like `stmt.in` is tricky in LALR parsers. Utilizing a separate environment stack during mid-rule actions is an elegant way to resolve this limitation.
3.  **Modern Tool Integration**: Writing a clean `build.ps1` script to coordinate `win_flex`, `win_bison`, and `gcc` significantly accelerated developer feedback loops during testing.
