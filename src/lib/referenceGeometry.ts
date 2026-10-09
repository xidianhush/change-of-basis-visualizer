import { math, type Matrix } from './matrix'

export type Vec = number[]
export type Segment = [Vec, Vec]

/** 规范参考网格点（基坐标下，以原点为中心） */
export function gridPoints(dim: 2 | 3): Vec[] {
  const coords2d = [-1, -0.5, 0, 0.5, 1]
  const coords3d = [-1, 0, 1]
  const points: Vec[] = []

  if (dim === 2) {
    for (const x of coords2d) for (const y of coords2d) points.push([x, y])
  } else {
    for (const x of coords3d)
      for (const y of coords3d) for (const z of coords3d) points.push([x, y, z])
  }
  return points
}

/** 规范单位正方形（2D）/ 单位立方体（3D）的边，顶点坐标为 ±1 */
export function frameEdges(dim: 2 | 3): Segment[] {
  const edges: Segment[] = []

  if (dim === 2) {
    const square: Vec[] = [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ]
    for (let i = 0; i < square.length; i++) {
      edges.push([square[i], square[(i + 1) % square.length]])
    }
    return edges
  }

  // 3D：8 个顶点，两顶点恰好一个坐标不同即为一条边
  const verts: Vec[] = []
  for (const x of [-1, 1])
    for (const y of [-1, 1]) for (const z of [-1, 1]) verts.push([x, y, z])
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const diff = verts[i].filter((v, k) => Math.abs(v - verts[j][k]) > 1e-9).length
      if (diff === 1) edges.push([verts[i], verts[j]])
    }
  }
  return edges
}

/** 矩阵作用于单个点（列向量） */
export function transformPoint(M: Matrix, p: Vec): Vec {
  return math.multiply(M, p) as unknown as Vec
}

export function transformPoints(M: Matrix, points: Vec[]): Vec[] {
  return points.map((p) => transformPoint(M, p))
}

export function transformSegments(M: Matrix, segments: Segment[]): Segment[] {
  return segments.map(([a, b]) => [transformPoint(M, a), transformPoint(M, b)])
}
