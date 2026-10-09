# 线性代数基变换与相似矩阵可视化实验室

> Change of Basis & Similar Matrices Visualizer · `B = P⁻¹AP`

一个 2D / 3D 自适应的交互式数学可视化网页，用于展示**同一个线性变换在不同基（坐标系）下的矩阵表示（相似矩阵）**以及随之产生的**空间形变**。

## 功能特性

- **LaTeX 矩阵输入**：使用 `\begin{bmatrix} ... \end{bmatrix}` 输入，支持解析与 KaTeX 预览；元素支持分数 `\frac{1}{2}`、`\sqrt{2}`、`\pi`、四则运算等。
- **维度自适应**：输入 2×2 显示 2D（正交相机），输入 3×3 显示 3D（透视相机，可旋转观察）。
- **四宫格联动（CSS Grid 2×2）**：
  - 左上：坐标系 1 · 变换前（标准基 + 单位网格）
  - 右上：坐标系 1 · 变换后（应用 `A`）
  - 左下：坐标系 2 · 变换前（基 `P`，点经 `v_std = P·v_new` 映射）
  - 右下：坐标系 2 · 变换后（点经 `P·B·v_new`）
- **数据面板**：实时展示 `A`、`B`、`P`、`P⁻¹` 与两组基向量，并自动判定是否满足 `B = P⁻¹AP`。
- **默认预设**：旋转 90°、剪切、对角化（特征基，`B=diag(3,1)`）、特征基（`B=diag(3,-1)`）、3D 缩放；均严格满足相似关系。
- **自由探索**：可故意输入不满足公式的 `B`，观察两个坐标系变换结果的形变异常（徽标变红）。
- **平滑动画**：矩阵变化时参考点、线框、基向量以 easeInOutCubic 补间过渡，四宫格同步；补间基于墙钟时间，帧率无关。

## 技术栈

- React 18 + TypeScript + Vite 5
- Three.js + @react-three/fiber v8 + @react-three/drei v9
- mathjs（矩阵乘法 / 求逆 / 元素求值）
- zustand（全局状态）
- Tailwind CSS v4 + lucide-react（暗色科技风 UI）
- KaTeX + react-katex（矩阵渲染）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

> 需要支持 WebGL 的现代浏览器。

## 目录结构

```
src/
├── App.tsx                     # 整体布局：顶栏 + 输入面板 + 数据面板 + 四宫格
├── main.tsx
├── index.css                   # Tailwind v4 + 暗色全局样式
├── components/
│   ├── InputPanel.tsx          # LaTeX 输入 + 预设 + 错误提示
│   ├── DataPanel.tsx           # A/B/P/P⁻¹/基向量 KaTeX 面板 + 相似判定徽标
│   └── ViewCell.tsx            # 单个视口外壳（标题栏 + 图例）
├── lib/
│   ├── matrix.ts               # mathjs 封装：乘法、求逆、行列式、computeSimilar
│   ├── latex.ts                # bmatrix 解析、矩阵转 LaTeX、数值格式化
│   ├── presets.ts              # 默认预设（B 由公式现算）
│   └── referenceGeometry.ts    # 参考网格点 / 单位框边 / 点变换
├── store/
│   └── useLabStore.ts          # zustand 全局状态与派生计算
└── three/
    ├── SceneCanvas.tsx         # 独立 Canvas：2D 正交 / 3D 透视 + 控制器
    ├── AnimatedScene.tsx       # 点云/线框/基箭头 + 确定性补间动画
    └── CanvasErrorBoundary.tsx # WebGL 失败兜底
```

## 核心数学说明

视觉上所有物体都渲染在**标准基**中。设新基的基向量矩阵（过渡矩阵）为 `P`（列即新基向量）：

- 坐标系 2 下的点 `v_new` 在屏幕上的真实坐标：`v_std = P · v_new`
- 坐标系 2 变换后的点：`v_std' = P · B · v_new`
- 相似关系：当 `B = P⁻¹AP` 时，`P·B = A·P`，即右下 = 用 `A` 作用于左下的每个点。

> 四个格子的参考物体是「各自基下的单位网格」，因此相似关系的视觉体现是 **右下 = A 作用于左下**；若对「同一个固定物理向量 v」做对照，则有严格的逐点重合 `P·B·P⁻¹v = A·v`。
