import {
  cellEndpoints,
  matVecMul,
  trackEndpoints,
  type CellId,
  type CellMatrices,
} from './motion'
import { gridPoints } from './referenceGeometry'

export interface Bounds {
  /** x 方向对称半范围 */
  hx: number
  /** y 方向对称半范围 */
  hy: number
  /** z 方向对称半范围（3D） */
  hz: number
}

const CELLS: CellId[] = ['c1-before', 'c1-after', 'c2-before', 'c2-after']

function accumulate(b: Bounds, p: number[]): void {
  if (Math.abs(p[0]) > b.hx) b.hx = Math.abs(p[0])
  if (Math.abs(p[1]) > b.hy) b.hy = Math.abs(p[1])
  if (p.length > 2 && Math.abs(p[2]) > b.hz) b.hz = Math.abs(p[2])
}

/**
 * 计算四宫格在整段动画「起点 + 终点」两种状态下，所有几何（参考点云与两支
 * 追踪向量）映射到标准基屏幕坐标后的最大对称包围范围。
 *
 * 因为每格动画都是 start→end 的线性插值，中途坐标不会超出两端的凸包，所以
 * 用这个包络确定的统一镜头在播放全程保持稳定、不会随滑块跳动。
 */
export function computeGlobalBounds(
  dim: 2 | 3,
  mats: CellMatrices,
  v1: number[] | null,
  v2: number[] | null,
): Bounds {
  const b: Bounds = { hx: 1, hy: 1, hz: 1 }
  const pts = gridPoints(dim)

  for (const cell of CELLS) {
    const ep = cellEndpoints(cell, dim, mats)
    for (const M of [ep.start, ep.end]) {
      for (const p of pts) accumulate(b, matVecMul(M, p))
    }

    // 坐标系1两格追踪 v1，坐标系2两格追踪 v2
    const tv = cell === 'c1-before' || cell === 'c1-after' ? v1 : v2
    if (tv && tv.length === dim) {
      const tep = trackEndpoints(cell, dim, mats)
      accumulate(b, matVecMul(tep.start, tv))
      accumulate(b, matVecMul(tep.end, tv))
    }
  }

  return b
}
