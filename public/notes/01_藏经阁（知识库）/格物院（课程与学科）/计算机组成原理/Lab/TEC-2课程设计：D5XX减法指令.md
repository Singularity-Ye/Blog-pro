---
title: "TEC-2 课程设计：D5XX 双绝对地址内存单元减法指令"
tags: [计算机组成原理, tec-2, 微程序, D5XX]
created: 2026-06-26
status: active
---

# TEC-2 课程设计：D5XX 双绝对地址内存单元减法指令

> 本笔记记录了 `D5XX` 双绝对地址减法并写回指令的微程序设计、调试与验证过程。
> 返回主索引：[[TEC-2课程设计：微程序设计|TEC-2 课程设计：微程序指令系统设计]]

---

## 1. 指令规格与数学模型
* **指令格式**: 三字指令
  ```text
  D5XX  ; 操作码（其中 XX 字节在微程序映射时被忽略）
  ADDR1 ; 操作数 1 绝对内存地址 (16位)
  ADDR2 ; 操作数 2 绝对内存地址 (16位)
  ```
* **功能定义**:
  $$
  \text{MEM}[ADDR1] \leftarrow \text{MEM}[ADDR1] - \text{MEM}[ADDR2]
  $$

---

## 2. 双轨制设计分析

### 🔬 学术轨：流水线中的地址保存与恢复
在微操作执行阶段，完成 $[ADDR1] - [ADDR2]$ 并写回 $ADDR1$ 的核心难点在于**地址线与数据线的冲突**：
1. CPU 必须首先读取 $ADDR1$ 地址字，并将主存单元 $[ADDR1]$ 的数据读入暂存寄存器 $Q$ 中。
2. 随后，CPU 读取 $ADDR2$ 地址字，并将主存单元 $[ADDR2]$ 读出参与减法运算。
3. 读取 $[ADDR2]$ 时，地址寄存器（$AR$）必然被修改为 $ADDR2$。因此，为了在运算结束后将结果写回 $ADDR1$，必须在 $AR$ 被覆盖前，将 $ADDR1$ 暂存到通用寄存器（如 $R0$）中。
4. 在 ALU 完成 $Q - \text{MEM}[ADDR2]$ 的减法运算后，必须重新恢复 $AR \leftarrow R0$（即指向 $ADDR1$），方可将结果正确写入 $ADDR1$ 单元。

### 💡 直觉轨：“GPS 导航与便利贴”比喻
> 想象一个快递员，他的任务是去**A号房**（$ADDR1$）取出一箱货物，扣除掉**B号房**（$ADDR2$）里指定的货物数量，然后把剩下的货物送回**A号房**。
> 
> 当快递员走到B号房时，他的 GPS 导航仪（$AR$）里的目的地已经变成了“B号房”。如果他扣减完货物后直接卸货，货物就会被错误地送进B号房！
> 
> 为了不迷路，快递员必须在去B号房之前，把**“A号房的地址”写在一张便利贴（通用寄存器 $R0$）上**。等扣减完货物后，他把便利贴上的地址重新输入 GPS（$AR \leftarrow R0$），导航仪导回A号房，最后成功把货卸在A号房。

---

## 3. 微操作流程与符号表示

微程序共包含 9 条微指令，存放在控制存储器 `100H` 开始的区域：

$$
\begin{array}{llll}
\hline
\text{控存地址} & \text{微操作流程} & \text{详细功能说明} \\
\hline
100\text{H} & PC \rightarrow AR, PC + 1 \rightarrow PC & \text{取第一个地址字 } ADDR1 \text{ 读入 } AR \\
101\text{H} & \text{MEM} \rightarrow R0 & \text{将 } ADDR1 \text{ 保存至通用寄存器 } R0 \text{（便利贴暂存）} \\
102\text{H} & \text{MEM} \rightarrow AR & \text{将 } ADDR1 \text{ 送入 } AR\text{，指向第一个操作数单元} \\
103\text{H} & \text{MEM} \rightarrow Q & \text{将被减数 } [ADDR1] \text{ 读入暂存器 } Q \\
104\text{H} & PC \rightarrow AR, PC + 1 \rightarrow PC & \text{取第二个地址字 } ADDR2 \text{ 读入 } AR \\
105\text{H} & \text{MEM} \rightarrow AR & \text{将 } ADDR2 \text{ 送入 } AR\text{，指向减数单元} \\
106\text{H} & Q - \text{MEM} \rightarrow Q & \text{ALU 减法运算，结果暂存入 } Q \text{（核心指令位 } 01E0\text{）} \\
107\text{H} & R0 \rightarrow AR & \text{恢复写回目标地址 } AR \leftarrow ADDR1 \text{（GPS 重新导航）} \\
108\text{H} & Q \rightarrow \text{MEM}, CC\# = 0 & \text{结果写入 } [ADDR1]\text{，清除条件码，返回公共取指微程序} \\
\hline
\end{array}
$$

---

## 4. 最终微码与 Monitor 操作流程

### Step 1: E900 输入微码
在 Monitor 监控程序中输入 `E900`，在冒号后依次输入最终确定的 9 条微指令代码：
```text
>E900
0900: 0000 0E00 A0B5 5402 0000 0E00 30F0 0000 0000 0E00 10F0 0002 0000 0E00 00F0 0000 0000 0E00 A0B5 5402 0000 0E00 10F0 0002 0000 0E01 01E0 0000 0000 0E00 90B0 0002 0029 0300 1020 0010
```
输入完成后，直接回车退出。

### Step 2: D900 检查微码
输入 `D900` 检查主存中写入的微码内容：
```text
>D900
0900  0000 0E00 A0B5 5402 0000 0E00 30F0 0000
0908  0000 0E00 10F0 0002 0000 0E00 00F0 0000
0910  0000 0E00 A0B5 5402 0000 0E00 10F0 0002
0918  0000 0E01 01E0 0000 0000 0E00 90B0 0002
0920  0029 0300 1020 0010 ...
```
> [!IMPORTANT]
> 重点检查：`091A` 地址处的内容必须为 `01E0`（减法 ALU 操作控制位）。若误写作 `02E0`，将导致减数与被减数方向相反。

![TEC2_CD_D5XX_D900_Check.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D5XX_D900_Check.png)
*图 1: D900 检查微程序代码（显示 `01E0` 说明减法运算控制位正确）*

### Step 3: 加载微程序至控存（`100H`）
输入 `A800` 编写微码装载程序：
```asm
MOV R1, 0900  ; 微码在主存中的源起始地址
MOV R2, 0009  ; 9条微指令
MOV R3, 0100  ; 写入控制存储器的目标首地址 (100H)
LDMC          ; 执行加载微控存命令
RET
```
使用 `U800` 进行反汇编检查：

![TEC2_CD_D5XX_U800_Loader.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D5XX_U800_Loader.png)
*图 2: U800 反汇编检查装载程序（共 9 条指令导入 100H 控存入口）*

输入 `G800` 执行微码加载。确保系统未出现 `Dead cycle!` 错误提示。

---

## 5. 测试程序与结果验证

### 测试用例设计
* **初始测试数据**:
  * $[0A00] = 0028\text{H}$（被减数，十进制 40）
  * $[0A01] = 0005\text{H}$（减数，十进制 5）
* **期待执行结果**:
  * $[0A00] \leftarrow 0028\text{H} - 0005\text{H} = 0023\text{H}$（结果写回 $ADDR1$）
  * $[0A01] = 0005\text{H}$（操作数 2 保持原值）

### 编写测试程序（`A820`）
```asm
0820: MOV R0, 0028
0822: MOV [0A00], R0
0824: MOV R0, 0005
0826: MOV [0A01], R0
0828: NOP             ; 预留给新指令机器码占位
0829: NOP             ; 预留给 ADDR1 占位
082A: NOP             ; 预留给 ADDR2 占位
082B: RET
```

### 插入新机器指令（`E828`）
在新指令预留地址 `0828` 处插入 D5XX 宏指令：
```text
>E828
0828: D500 0A00 0A01
```

使用 `U820` 查看测试程序反汇编：

![TEC2_CD_D5XX_U820_Test.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D5XX_U820_Test.png)
*图 3: U820 反汇编测试程序*

### 运行并观察内存
执行 `G820` 运行测试程序，运行结束后使用 `DA00` 检查主存中 `0A00` 区域的值：

![TEC2_CD_D5XX_DA00_Result.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D5XX_DA00_Result.png)
*图 4: DA00 检查运行结果（0A00 成功被覆写为 0023H，0A01 保持 0005H）*

---

## 6. 调试与排错记录：ALU 减法方向判定

在首次微程序设计中，第 7 条微指令（地址 `106H`）在控制指令段使用了常规教材推荐的减法控制字段 `02E0`：

```text
0000 0E01 02E0 0000  ; 对应汇编意图: MEM - Q -> Q
```

但在测试用例 $[0A00]=0028\text{H}$ 且 $[0A01]=0005\text{H}$ 下，执行 `G820` 后，通过 `DA00` 观察到了意外的内存结果：
* $[0A00] = \text{FFDD}\text{H}$
* $[0A01] = 0005\text{H}$

### 排错数理推导
由于：
$$
\text{FFDD}\text{H} = -35\text{D} = 5\text{D} - 40\text{D} = [ADDR2] - [ADDR1]
$$

这表明 `02E0` 在当前 TEC-2 机型芯片控制线上的实际减法方向是 $MEM - Q$，即用 $ADDR2$ 单元的值减去被暂存在 $Q$ 中的 $ADDR1$。

这与实验要求的 $[ADDR1] - [ADDR2]$ 正好相反。为了修正为 $Q - MEM$，需要将第 7 条微指令中的 ALU 操作控制位由 `02E0` 修改为 `01E0`：

```text
0000 0E01 01E0 0000  ; 修正为: Q - MEM -> Q
```

重新装载微码并运行后，结果恢复为正确的 `0023H`，排错成功。

![TEC2_CD_D5XX_Sub_Dir_Error.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D5XX_Sub_Dir_Error.png)
*图 5: 减法方向相反时的调试记录（0A00 结果为 FFDDH，证明减法反向，为 01E0 修正提供支撑）*
