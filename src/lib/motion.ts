import { identity, lerpMatrix, type Matrix } from './matrix'

/** 四宫格单元标识 */
export type CellId = 'c1-before' | 'c1-after' | 'c2-before' | 'c2-after'

/** 复合演示分为 4 段，滑块 t∈[0,1] 均分 */
export const PHASE_COUNT = 4

/** 原生小矩阵 × 列向量（n×n · n），供渲染循环高频调用 */
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

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** 每个格子对应的播放段（0~3） */
export function cellPhase(cell: CellId): number {
  switch (cell) {
    case 'c1-before':
      return 0
    case 'c1-after':
      return 1
    case 'c2-before':
      return 2
    case 'c2-after':
      return 3
  }
}

/** 滑块当前处于第几段（0~3） */
export function phaseOf(t: number): number {
  return Math.min(PHASE_COUNT - 1, Math.floor(t * PHASE_COUNT))
}

export interface CellMatrices {
  basis1: Matrix | null
  A: Matrix | null
  P: Matrix | null
  B: Matrix | null
}

export interface CellEndpoints {
  /** 该格动画起点（屏幕标准基矩阵） */
  start: Matrix
  /** 该格动画终点（屏幕标准基矩阵） */
  end: Matrix
  /** 播放段索引 */
  phase: number
}

/**
 * 计算某个格子在当前输入下的动画起止矩阵（屏幕标准基坐标）：
 *   左上 c1-before：I → basis1       （basis1=I 时恒等不动）
 *   右上 c1-after ：basis1 → A
 *   左下 c2-before：basis1 → P       （应用 P，坐标系1 → 坐标系2）
 *   右下 c2-after ：P → P·B          （坐标系2 应用 B）
 * 矩阵缺失（解析错误）时以单位矩阵兜底。
 */
export function cellEndpoints(cell: CellId, dim: number, mats: CellMatrices): CellEndpoints {
  const I = identity(dim)
  const E = mats.basis1 ?? I
  const A = mats.A ?? I
  const P = mats.P ?? I
  const B = mats.B ?? I
  const PB = matMul(P, B)

  switch (cell) {
    case 'c1-before':
      return { start: I, end: E, phase: 0 }
    case 'c1-after':
      return { start: E, end: A, phase: 1 }
    case 'c2-before':
      return { start: E, end: P, phase: 2 }
    case 'c2-after':
      return { start: P, end: PB, phase: 3 }
  }
}

/**
 * 由滑块进度 t（0~1）计算某个格子当前应渲染的屏幕矩阵：
 * 仅在该格所属段内做 start→end 插值，段前保持 start、段后定格 end。
 */
export function cellMatrixAt(ep: CellEndpoints, t: number): Matrix {
  const local = clamp01(t * PHASE_COUNT - ep.phase)
  return lerpMatrix(ep.start, ep.end, local)
}
