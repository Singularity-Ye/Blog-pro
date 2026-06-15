# 实验 4：语义分析与属性文法设计实验报告

**学生基本信息**：
- **姓名**：叶浩祥
- **学号**：2024337621055
- **专业班级**：计算机科学与技术
- **课程名称**：编译原理与设计

---

## 一、 能力自我评估表 (Self-Assessment)

本实验根据评分标准，从“研究能力（理论、实践、总结）”与“三方工具利用能力”两个维度对实验完成度与报告质量进行自我打分：

### 1. 研究能力评估 (满分 50 分)
| 评估维度 | 对应能力项 | 评分 | 满分 | 说明 |
| :--- | :--- | :---: | :---: | :--- |
| **一、理论方面** | 属性文法规则设计的正确性与科学原理依据阐述。<sup>[一]</sup> | **15** | 15 | 设计了二叉树有序性及变量未定义检查的属性文法，逻辑严密，原理解释透彻。 |
| **二、实践方面** | 理解 Bison 语义动作的规约绑定机制，规范使用 YACC 属性。<sup>[二]</sup> | **15** | 15 | 深度分析了 Bison 动作的触发时机与环境栈设计，完全掌握属性的定义、分配与访问。 |
| **三、总结方面** | 实验结果描述与总结的有效性，测试方案的合理性与描述。<sup>[三]</sup> | **20** | 20 | 追踪了测试用例的状态流转，设计了完备的测试场景，并对工具边界进行了总结。 |
| **总分** | **研究能力综合评分** | **50** | **50** | **各项均达到优秀水平，给予自己满分自评。** |

### 2. 现代工具利用能力评估 (满分 50 分)
| 评估维度 | 核心评价指标 | 评分 | 满分 | 说明 |
| :--- | :--- | :---: | :---: | :--- |
| **四、bison 语义动作使用** | 正确使用 Bison 在规约（reduction）过程中绑定并触发语义动作。<sup>[四]</sup> | **25** | 25 | 完美利用 Bison 的中导动作与规约动作，实现了作用域环境的入栈、出栈与合并。 |
| **五、YACC 属性规范定义** | 正确在 YACC 中定义、分配、传递与释放非终结符和终结符的属性。<sup>[五]</sup> | **25** | 25 | 在 `%union` 中规范声明集合类型，通过词法与语法流转属性，并实现了严密的内存释放。 |
| **总分** | **现代工具利用能力综合评分** | **50** | **50** | **掌握了 LALR(1) 语法制导翻译的底层实现，自评满分。** |

---

## 二、 理论方面：属性文法设计 (Theoretical Design) <sup>[一]</sup>

### 1. 问题 1：整型二叉树有序性检查的属性文法设计 <sup>[一]</sup>
#### 1.1 问题描述
给定整型二叉树的线性化文法：
$$
\text{btree} \rightarrow (\text{ number } \text{ btree}_1 \text{ btree}_2 ) \mid \text{nil}
$$
需要编写属性文法，检查二叉树是否是“有序的”（即：左子树的所有数值 $\le$ 当前节点值，且右子树的所有数值 $\ge$ 当前节点值）。

#### 1.2 属性定义与设计思路
为了判断一棵子树是否满足有序条件，我们无法只依靠局部的节点值，而必须在子树的规约过程中**向上综合**子树的极值信息与有序状态。因此，我们为非终结符 `btree` 设计以下 4 个**综合属性（Synthesized Attributes）**：
1.  `is_nil`: 布尔值，标识当前子树是否为空（`nil`）。
2.  `is_ordered`: 布尔值，标识当前子树是否整体有序。
3.  `min_val`: 整数，当前子树中所有节点的最大最小值（仅在 `is_nil` 为 false 时有效）。
4.  `max_val`: 整数，当前子树中所有节点的最大最大值（仅在 `is_nil` 为 false 时有效）。

对于终结符 `number`，其拥有一个综合属性 `val`，代表该数字的字面值。

#### 1.3 语义规则设计
依据语法制导翻译原理，针对两条语法规则设计如下语义动作：

*   **规则 1**：$\text{btree} \rightarrow \text{nil}$
    $$
    \begin{aligned}
    &\text{btree.is\_nil} = \text{true} \\
    &\text{btree.is\_ordered} = \text{true} \\
    &\text{btree.min\_val} = \text{undefined} \\
    &\text{btree.max\_val} = \text{undefined}
    \end{aligned}
    $$
    *依据阐述*：空树天然是有序的，无需参与大小比较。

*   **规则 2**：$\text{btree} \rightarrow (\text{ number } \text{ btree}_1 \text{ btree}_2 )$
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
    *依据阐述*：
    1.  **有序性判断**：当前树要是有序的，必须满足：左子树有序、右子树有序、左子树的最大值 $\le$ 当前节点值（若左树非空）、右子树的最小值 $\ge$ 当前节点值（若右树非空）。这四个条件是充要条件，保证了局部与全局的有序性。
    2.  **极值综合**：当前树的最小值取决于左子树。若左子树为空，则当前节点值为最小值，否则为左子树的最小值；当前树的最大值同理取决于右子树。这一递推规则保证了父节点规约时能获取到子树真实的边界极值。

---

### 2. 问题 2：Python 式未定义变量检查的属性文法设计 <sup>[一]</sup>
#### 2.1 属性定义
针对一个小型的类 Python 语言，我们需要静态检查变量是否可能在定义前被引用。为此设计以下属性：
*   `var.sname`：综合属性，从词法分析器获取的变量名字符串。
*   `expr.ref`：综合属性，当前表达式所引用的变量名集合。
*   `stmt.in`：**继承属性（Inherited Attribute）**，进入当前语句前已定义变量的集合。
*   `stmt.out`：**综合属性（Synthesized Attribute）**，执行当前语句后已定义变量的集合。

#### 2.2 语义规则设计
*   **规则 1**：$\text{stmt} \rightarrow \text{var} = \text{expr}$
    $$
    \begin{aligned}
    &\text{if } (\text{expr.ref} - \text{stmt.in}) \neq \emptyset \text{ then print } \text{"a variable may be undefined"} \\
    &\text{stmt.out} = \text{stmt.in} \cup \{\text{var.sname}\}
    \end{aligned}
    $$
    *依据阐述*：表达式右侧引用的变量集合 $\text{expr.ref}$ 必须是进入该语句前已定义集合 $\text{stmt.in}$ 的子集，否则抛出未定义异常。赋值完成后，左侧变量被加入已定义集合。

*   **规则 2**：$\text{stmt} \rightarrow \text{stmt}_1 \; ; \; \text{stmt}_2$
    $$
    \begin{aligned}
    &\text{stmt}_1\text{.in} = \text{stmt.in} \\
    &\text{stmt}_2\text{.in} = \text{stmt}_1\text{.out} \\
    &\text{stmt.out} = \text{stmt}_2\text{.out}
    \end{aligned}
    $$
    *依据阐述*：顺序执行语句中，前一个语句的输出集作为后一个语句的输入集。整个序列的输出是最后一个语句的输出。

*   **规则 3**：$\text{stmt} \rightarrow \text{if } \text{expr} \text{ then } \text{stmt}_1 \text{ else } \text{stmt}_2 \text{ fi}$
    $$
    \begin{aligned}
    &\text{if } (\text{expr.ref} - \text{stmt.in}) \neq \emptyset \text{ then print } \text{"a variable may be undefined"} \\
    &\text{stmt}_1\text{.in} = \text{stmt.in} \\
    &\text{stmt}_2\text{.in} = \text{stmt.in} \\
    &\text{stmt.out} = \text{stmt.in} \cup \text{stmt}_1\text{.out} \cup \text{stmt}_2\text{.out}
    \end{aligned}
    $$
    *依据阐述*：
    1.  条件表达式 `expr` 必须在当前环境下安全；
    2.  `then` 分支与 `else` 分支共享进入 `if` 之前的初始定义集；
    3.  按照题目要求：“在 IF 语句中定义变量后，无论在哪个分支定义，都认为在 if 之后已定义”。这对应静态分析中的**控制流并集（Union）**，即 $\text{stmt.out} = \text{stmt.in} \cup \text{stmt}_1\text{.out} \cup \text{stmt}_2\text{.out}$。

*   **表达式规则（综合属性向上累加）**：
    *   $\text{expr} \rightarrow \text{expr}_1 + \text{expr}_2 \implies \text{expr.ref} = \text{expr}_1\text{.ref} \cup \text{expr}_2\text{.ref}$
    *   $\text{expr} \rightarrow \text{expr}_1 < \text{expr}_2 \implies \text{expr.ref} = \text{expr}_1\text{.ref} \cup \text{expr}_2\text{.ref}$
    *   $\text{expr} \rightarrow \text{var} \implies \text{expr.ref} = \{\text{var.sname}\}$
    *   $\text{expr} \rightarrow \text{int\_const} \implies \text{expr.ref} = \emptyset$

---

## 三、 实践方面：Bison 语义动作机制与属性实现 (Practice) <sup>[二]</sup>

### 1. 对 Bison 语义动作绑定在规约过程中的理解 <sup>[四]</sup>
Bison 是一个自底向上的 LALR(1) 语法分析生成器。在分析过程中，它维护两个核心栈：
1.  **状态栈（State Stack）**：保存当前移进和待规约的分析器状态。
2.  **值栈（Value Stack）**：保存与每个符号关联的语义值（即属性）。

所有的**语义动作（Action）都是绑定在规约（Reduction）阶段执行的**。具体行为如下：
*   当且仅当分析器识别出某一产生式的右部（Right-Hand Side, RHS），并决定将其规约到左部非终结符（Left-Hand Side, LHS）时，绑定的 C 动作块才会被执行。
*   在中导动作（Mid-Rule Actions）中，Bison 会在内部隐式地引入一个空产生式（如 `$$ = \epsilon`），并在该空产生式规约时执行相应的中导动作代码。
*   在本实验中，例如进入 `stmt_list` 之前 and `IF` 分支切换时，必须精确控制当前已定义集合（全局变量 `current_in`）的状态。由于这些状态转换发生在中途，如果不理解规约时机，就无法正确设计环境栈。我们在 `THEN` 后和 `ELSE` 后插入的中导动作，正是在语法树向下推导分支、规约虚拟符号时触发的，确保了继承属性的流转方向正确。

---

### 2. 属性在 YACC/Bison 中的规范定义与使用 <sup>[五]</sup>
为了在 C 语言实现的 Bison 解析器中实现属性文法，我们严格遵循了 YACC 的四维度规范：

#### 2.1 属性类型的合理定义 (Define attributes as types)
为了存储和计算变量集合，在 `set.h` 中定义了基于动态数组的字符串集合类型：
```c
typedef struct Set Set;
// 支持的接口包括：创建、单例、克隆、包含判定、并集、差集、打印和释放
Set *set_create(void);
Set *set_singleton(const char *name);
Set *set_clone(const Set *set);
void set_add(Set *set, const char *name);
Set *set_union_new(const Set *left, const Set *right);
Set *set_difference_new(const Set *left, const Set *right);
void set_free(Set *set);
```

#### 2.2 在 `%union` 中列出属性类型 (Include type name in %union)
在 `undefined_checker.y` 中，定义了三类语义值通道：
```yacc
%union {
    char *text;     /* 终结符 VAR 的变量名 */
    int number;     /* 终结符 INT_CONST 的字面值 */
    Set *set;       /* 非终结符 expr 和 stmt 的已引/已定义变量集合 */
}
```

#### 2.3 为终结符和非终结符关联属性类型 (Assign attributes)
在声明区中，将具体的属性类型绑定至对应的语法符号：
```yacc
%token <text> VAR
%token <number> INT_CONST
%type <set> program stmt_list stmt expr rel_expr add_expr atom
```
*词法关联*：在 `undefined_checker.l` 中，当匹配到标识符时，动态拷贝该字符串并赋值给 `yylval.text`，最后返回 `VAR`：
```lex
{ID_START}{ID_CHAR}*       { yylval.text = copy_text(yytext); return VAR; }
```

#### 2.4 在语义动作中安全地访问与管理属性值 (Accessing & managing attributes)
在规约动作中，`$1`、`$2` 等代表右部符号的值栈内容，`$$` 代表产生式左部非终结符的返回值。
由于 C 语言没有垃圾回收机制，我们必须严密地管理集合与变量名的生存周期，防止内存泄露：
*   **读取与传递**：在 `atom: VAR` 规约时，将词法分析器传入的 `$1`（即字符指针）转化为单例集合：
    ```yacc
    atom: VAR  { $$ = set_singleton($1); free($1); } // 立即 free($1) 防止字符串泄露
    ```
*   **计算与释放**：在加法和比较运算规约时，生成新的并集后，立即释放两个子节点的集合：
    ```yacc
    add_expr '+' atom  { $$ = set_union_new($1, $3); set_free($1); set_free($3); }
    ```
*   **赋值判定与环境修改**：
    在 `assign_stmt` 中，我们将 `refs`（即右侧表达式引用的变量集合）与当前环境 `current_in` 做差集，如有未定义变量则报警；随后将左侧变量加入 `current_in` 克隆出的新集合，最后释放 `refs` 占用的内存。

---

## 四、 总结与测试方面 (Summary and Testing) <sup>[三]</sup>

### 1. 测试方案与用例详细追踪
为了证明语义检查器的正确性，本实验准备了正面用例与反面用例，并对其执行流程中的环境状态（即已定义变量集合 `current_in`）进行全生命周期追踪。

#### 1.1 正常流测试 (`sample_ok.pymini`)
*   **源程序**：
    ```python
    x = 1;
    y = x + 2;
    if y < 10 then z = y else w = 3 fi;
    q = z + w
    ```
*   **执行轨迹追踪表**：
    | 行号 | 规约语句/动作 | 进入前 `current_in` | 表达式引用 `ref` | 检查结果 | 结束后 `current_in` |
    | :---: | :--- | :--- | :--- | :---: | :--- |
    | 1 | `x = 1` | `{}` | `{}` | OK | `{x}` |
    | 2 | `y = x + 2` | `{x}` | `{x}` | OK | `{x, y}` |
    | 3.1 | `if y < 10` | `{x, y}` | `{y}` | OK | 压栈保存 `{x, y}` |
    | 3.2 | `then z = y` | `{x, y}` | `{y}` | OK | 产生 then 分支输出 `{x, y, z}` |
    | 3.3 | 切换分支 | 弹出并恢复栈顶 `{x, y}` | - | - | 栈顶备份，`current_in` 重置为 `{x, y}` |
    | 3.4 | `else w = 3` | `{x, y}` | `{}` | OK | 产生 else 分支输出 `{x, y, w}` |
    | 3.5 | `fi` (合并) | - | - | - | 取并集并恢复为 `{x, y, z, w}` |
    | 4 | `q = z + w` | `{x, y, z, w}` | `{z, w}` | OK | `{x, y, z, w, q}` |
*   **实际输出**：
    ```text
    final defined variables = {x, y, z, w, q}
    ```
    完全符合预期，未定义检查器成功验证了该安全程序的合法性。

#### 1.2 异常流测试 (`sample_errors.pymini`)
*   **源程序**：
    ```python
    x = y + 1;
    if x < z then a = x else b = 2 fi;
    c = a + d
    ```
*   **警告触发追踪分析**：
    1.  **第 1 行 `x = y + 1`**：表达式引用 `ref = {y}`，而此时定义集 `current_in = {}`。由于 $\{y\} - \{\} = \{y\} \neq \emptyset$，触发**第 1 次** `"a variable may be undefined"` 警告。规约结束后 `current_in` 强行加入左值更新为 `{x}`。
    2.  **第 2.1 行 `if x < z`**：条件表达式 `ref = {x, z}`，而当前定义集为 `{x}`。计算差集 $\{x, z\} - {x} = \{z\} \neq \emptyset$，触发**第 2 次** `"a variable may be undefined"` 警告。
    3.  **第 2.2 行 `then a = x`**：`ref = {x}`，差集为空。规约后分支输出为 `{x, a}`。
    4.  **第 2.3 行 `else b = 2`**：`ref = {}`。规约后分支输出为 `{x, b}`。
    5.  **第 2.4 行 `fi` (合并)**：分支合并结果为 `{x, a} ∪ {x, b} = {x, a, b}`，更新为新的定义集。
    6.  **第 3 行 `c = a + d`**：表达式 `ref = {a, d}`。此时定义集为 `{x, a, b}`。差集为 $\{a, d\} - \{x, a, b\} = \{d\} \neq \emptyset$，触发**第 3 次** `"a variable may be undefined"` 警告。规约后定义集更新为 `{x, a, b, c}`。
*   **实际输出**：
    ```text
    a variable may be undefined
    a variable may be undefined
    a variable may be undefined
    final defined variables = {x, a, b, c}
    ```
    检查器在没有退出解析的情况下，准确抛出了 3 次警告，并输出了正确的终态变量集合，表现极其稳定。

---

### 2. 实验总结与收获
本实验通过将理论上的属性文法（SDT）转换为 Bison 中的规约语义动作，使我对于编译器后端在语法树上进行静态分析的原理有了具体而微的认识：
1.  **静态单赋值与数据流合并的局限**：在静态分析中，`IF` 语句的合并采用并集（`Union`）是本实验的特定简化规则。但在实际的 Python 或其他生产语言中，由于控制流的不确定性，静态分析工具（如 PyCharm/MyPy）往往采用交集（`Intersection`）作为更保守的安全线（即两分支都定义才算定义），这启发我们根据不同的“悲观度/乐观度”调整合并语义。
2.  **LALR(1) 与 SDD 翻译的时机问题**：使用自底向上语法分析器实现继承属性（如 `stmt.in`）存在天然的滞后性。本实验通过环境栈 `env_stack` 机制在适当的节点进行环境保存与规约恢复，成功将继承属性映射为物理上的环境推导，这是处理非纯综合属性文法时的经典实践。
3.  **开发工具的使用体验**：熟练编写了 Windows 环境下的一键构建脚本 `build.ps1`，将 `win_flex`、`win_bison` 与宿主 `gcc` 编译器联合在一起，极大提升了测试反馈速度。本实验加深了我对于前端词法、语法到后端语义分析层层递演的系统性理解。
