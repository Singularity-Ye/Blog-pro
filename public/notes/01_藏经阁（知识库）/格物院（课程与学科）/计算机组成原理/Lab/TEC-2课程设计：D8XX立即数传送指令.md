---
title: "TEC-2 课程设计：D8XX 立即数传送至内存单元指令"
tags: [计算机组成原理, tec-2, 微程序, D8XX]
created: 2026-06-26
status: active
---

# TEC-2 课程设计：D8XX 立即数传送至内存单元指令

> 本笔记记录了 `D8XX` 立即数写主存指令的微程序设计、调试与验证过程。
> 返回主索引：[[TEC-2课程设计：微程序设计|TEC-2 课程设计：微程序指令系统设计]]

---

## 1. 指令规格与数学模型
* **指令格式**: 三字指令
  ```text
  D8XX  ; 操作码（其中 XX 字节被微程序映射忽略）
  ADDR  ; 目标主存绝对地址 (16位)
  DATA  ; 待写入的立即数数据 (16位)
  ```
* **功能定义**:
  $$
  \text{MEM}[ADDR] \leftarrow DATA
  $$

---

## 2. 双轨制设计分析

### 🔬 学术轨：立即数暂存与目标定位
由于立即数 $DATA$ 和目标地址 $ADDR$ 都存储在机器指令本身的后续地址字中，数据通路的微操作需要分步读取：
1. 取出第二个字（目标地址 $ADDR$），但此时还不能直接访问该地址写入，因为 PC 还需要指向第三个字读取 $DATA$。因此必须将 $ADDR$ 读出后保存在通用寄存器 $R0$ 中。
2. 递增 PC 并取出第三个字（数据字 $DATA$），读入暂存寄存器 $Q$ 中。
3. 随后，将 $R0$ 中的目标地址送回地址寄存器 $AR$（$AR \leftarrow R0$）。
4. 最后，执行主存写操作，将寄存器 $Q$ 中的数据写入 $AR$ 指向的主存单元（$\text{MEM}[AR] \leftarrow Q$），并清除条件码返回。

### 💡 直觉轨：“精确投递的收发室中转”
> 快递员手里有一张纸条，上面写着要把**一份礼物（立即数 DATA）**送到**张三家（地址 ADDR）**。
> 
> 快递员先看第一页指令，得知要读取张三家的地址。他把地址抄在本子上（$R0 \leftarrow ADDR$），因为如果现在就导航过去，他就无法读取指令后页中“礼物具体是什么”的信息了。
> 
> 翻到下一页指令后，他把礼物抱在怀里（$Q \leftarrow DATA$）。拿到礼物后，他看着本子上的地址重新输入导航仪（$AR \leftarrow R0$），开车到达目的地，将礼物送进箱子（$[ADDR] \leftarrow Q$），任务完成。

---

## 3. 微操作流程与符号表示

微程序共包含 6 条微指令，存放在控制存储器 `110H` 开始的区域：

$$
\begin{array}{llll}
\hline
\text{控存地址} & \text{微操作流程} & \text{详细功能说明} \\
\hline
110\text{H} & PC \rightarrow AR, PC + 1 \rightarrow PC & \text{取目标地址字 } ADDR \text{ 读入 } AR \\
111\text{H} & \text{MEM} \rightarrow R0 & \text{将目标地址暂存至通用寄存器 } R0 \\
112\text{H} & PC \rightarrow AR, PC + 1 \rightarrow PC & \text{取立即数数据字 } DATA \text{ 读入 } AR \\
113\text{H} & \text{MEM} \rightarrow Q & \text{将立即数数据暂存至通用寄存器 } Q \\
114\text{H} & R0 \rightarrow AR & \text{将目标地址恢复送入 } AR\text{，定位主存写入点} \\
115\text{H} & Q \rightarrow \text{MEM}, CC\# = 0 & \text{将数据 } Q \text{ 写入主存并返回公共取指微程序} \\
\hline
\end{array}
$$

---

## 4. 最终微码与 Monitor 操作流程

### Step 1: E940 输入微码
为了避免覆盖 D5XX（0900H 起始）的微码，将 D8XX 的微码输入在主存 `0940H` 地址处：
```text
>E940
0940: 0000 0E00 A0B5 5402 0000 0E00 30F0 0000 0000 0E00 A0B5 5402 0000 0E00 00F0 0000 0000 0E00 90B0 0002 0029 0300 1020 0010
```

### Step 2: D940 检查微码
输入 `D940` 检查主存中写入的微码内容：
```text
>D940
0940  0000 0E00 A0B5 5402 0000 0E00 30F0 0000
0948  0000 0E00 A0B5 5402 0000 0E00 00F0 0000
0950  0000 0E00 90B0 0002 0029 0300 1020 0010
```
> [!IMPORTANT]
> 重点检查：`0946` 处必须为 `30F0`（MEM $\rightarrow$ R0），`094E` 处必须为 `00F0`（MEM $\rightarrow$ Q），`0952` 处必须为 `90B0`（R0 $\rightarrow$ AR）。这三个位置负责地址和数据的调度。

![TEC2_CD_D8XX_D940_Check.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D8XX_D940_Check.png)
*图 1: D940 检查 D8XX 微程序代码*

### Step 3: 加载微程序至控存（`110H`）
输入 `A800` 编写微码装载程序：
```asm
MOV R1, 0940  ; 此次源地址为 0940H
MOV R2, 0006  ; D8XX 共计 6 条微指令
MOV R3, 0110  ; 写入控制存储器的首地址为 110H
LDMC          ; 执行加载控存
RET
```
使用 `U800` 进行反汇编检查：

![TEC2_CD_D8XX_U800_Loader.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D8XX_U800_Loader.png)
*图 2: U800 反汇编检查装载程序（6 条微指令导入 110H 入口）*

输入 `G800` 执行微码加载。确保系统未出现 `Dead cycle!` 错误提示。

---

## 5. 测试程序与结果验证

### 测试用例设计
* **初始测试数据**: $[0A10] = 0000\text{H}$（先清零，避免干扰）
* **测试指令**: `D800 0A10 1234`
* **期待执行结果**: $[0A10] \leftarrow 1234\text{H}$

### 编写测试程序（`A840`）
```asm
0840: MOV R0, 0000
0842: MOV [0A10], R0
0844: NOP             ; 预留给新指令机器码占位
0845: NOP             ; 预留给 ADDR 占位
0846: NOP             ; 预留给 DATA 占位
0847: RET
```

### 插入新机器指令（`E844`）
在 `0844` 处插入 D8XX 传送指令：
```text
>E844
0844: D800 0A10 1234
```

使用 `U840` 查看测试程序反汇编：

![TEC2_CD_D8XX_U840_Test.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D8XX_U840_Test.png)
*图 3: U840 反汇编测试程序*

### 运行并观察内存
执行 `G840` 运行测试程序，运行结束后使用 `DA10` 检查主存中 `0A10` 区域的值：

![TEC2_CD_D8XX_DA10_Result.png](/notes/attachments/attachments/01_%E8%97%8F%E7%BB%8F%E9%98%81%EF%BC%88%E7%9F%A5%E8%AF%86%E5%BA%93%EF%BC%89/%E6%A0%BC%E7%89%A9%E9%99%A2%EF%BC%88%E8%AF%BE%E7%A8%8B%E4%B8%8E%E5%AD%A6%E7%A7%91%EF%BC%89/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BB%84%E6%88%90%E5%8E%9F%E7%90%86/TEC2_CD_D8XX_DA10_Result.png)
*图 4: DA10 检查运行结果（0A10 成功被覆写为 1234H，测试成功）*

---

## 6. D8XX 调试与排错警示

* **目标内存无变化（0A10 仍为 0000）**:
  - 说明 D800 指令未执行。重点检查是否正确在 `0844` 插入了 `D800 0A10 1234`；
  - 检查控存装载时 `R3` 是否指向 `0110` 入口。
* **数据写入奇怪的地址**:
  - 说明目标地址在流水线传递中丢失。重点检查 `0946` 处是否为 `30F0`（正确保存地址至 $R0$）以及 `0952` 是否为 `90B0`（正确从 $R0$ 恢复至 $AR$）。
