import { identity, lerpMatrix, type Matrix } from './matrix'

/** 原生小矩阵 × 列向量（n×n · n），供渲染循环高频调用，避免 mathjs 开销 */
export function matVecMul(M: Matrix, v: number[]): number[] {
  const n = M.length
  const r = new Array<number>(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = 0
    const row = M[i]
    for (let j = 0; j < n; j++) s += row[j] * v[j]
    r[i] = s
  }
  return r
}

/** 原生小矩阵乘法（n×n · n×n） */
export function matMul(A: Matrix, B: Matrix): Matrix {
  const n = A.length
  const C: Matrix = []
  for (let i = 0; i < n; i++) {
    const row: number[] = []
    for (let j = 0; j < n; j++) {
      let s = 0
      for (let k = 0; k < n; k++) s += A[i][k] * B[k][j]
      row.push(s)
    }
    C.push(row)
  }
  return C
}

/**
 * 复合变换动画的三步关键矩阵（B = P⁻¹AP 的连续左乘路径）：
 *   I → P → A·P → P⁻¹·A·P
 */
export type Motion = { I: Matrix; P: Matrix; AP: Matrix; B: Matrix }

export function buildMotion(P: Matrix, A: Matrix, Pinv: Matrix): Motion {
  const n = P.length
  const I = identity(n)
  const AP = matMul(A, P) // 阶段2 目标
  const B = matMul(Pinv, AP) // P⁻¹·A·P，阶段3 目标
  return { I, P, AP, B }
}

/** 当前处于第几个阶段（1 / 2 / 3） */
export function phaseOf(t: number): 1 | 2 | 3 {
  if (t < 1 / 3) return 1
  if (t < 2 / 3) return 2
  return 3
}

/**
 * 由时间轴 progress（0~1）计算当前插值矩阵 M(t)：
 *   阶段1  I → P        （t∈[0,1/3]）
 *   阶段2  P → A·P      （t∈[1/3,2/3]）
 *   阶段3  A·P → P⁻¹·A·P（t∈[2/3,1]）
 */
export function motionMatrix(m: Motion, t: number): Matrix {
  if (t < 1 / 3) return lerpMatrix(m.I, m.P, t * 3)
  if (t < 2 / 3) return lerpMatrix(m.P, m.AP, (t - 1 / 3) * 3)
  return lerpMatrix(m.AP, m.B, (t - 2 / 3) * 3)
}
