import { computeSimilar, identity, type Matrix } from './matrix'

export type Preset = {
  id: string
  name: string
  dim: 2 | 3
  basis1: Matrix
  P: Matrix
  A: Matrix
  B: Matrix
}

function makePreset(
  id: string,
  name: string,
  dim: 2 | 3,
  P: Matrix,
  A: Matrix,
): Preset {
  const basis1 = identity(dim)
  // B 由公式现算，从源头保证 B = P^{-1}AP
  return { id, name, dim, basis1, P, A, B: computeSimilar(A, P) }
}

export const PRESETS: Preset[] = [
  // 1. 标准基下的 90° 旋转（P = I，作为基线）
  makePreset('rotate90', '旋转 90°', 2, identity(2), [
    [0, -1],
    [1, 0],
  ]),

  // 2. 剪切变换，换到一组非正交基
  makePreset(
    'shear',
    '剪切',
    2,
    [
      [2, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [0, 1],
    ],
  ),

  // 3. 对角化：P 的列为 A 的特征向量，B 为对角阵 diag(3,1)
  makePreset(
    'diagonalize',
    '对角化',
    2,
    [
      [1, 1],
      [1, -1],
    ],
    [
      [2, 1],
      [1, 2],
    ],
  ),

  // 4. 特征基：对称矩阵，含负特征值，B = diag(3,-1)
  makePreset(
    'eigenbasis',
    '特征基',
    2,
    [
      [1, 1],
      [1, -1],
    ],
    [
      [1, 2],
      [2, 1],
    ],
  ),

  // 5. 3D 缩放，换到一组非标准基（用于演示维度自适应）
  makePreset(
    'scale3d',
    '3D 缩放',
    3,
    [
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [2, 0, 0],
      [0, 1, 0],
      [0, 0, 0.5],
    ],
  ),
]
