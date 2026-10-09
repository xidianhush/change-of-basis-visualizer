import { create, all, type MathJsInstance } from 'mathjs'

export const math: MathJsInstance = create(all)

export type Matrix = number[][]

export function identity(n: number): Matrix {
  const m: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  for (let i = 0; i < n; i++) m[i][i] = 1
  return m
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  return math.multiply(a, b) as unknown as Matrix
}

export function inv(a: Matrix): Matrix {
  return math.inv(a) as unknown as Matrix
}

export function det(a: Matrix): number {
  return math.det(a) as unknown as number
}

export function isInvertible(a: Matrix, tol = 1e-9): boolean {
  return Math.abs(det(a)) > tol
}

/** 相似矩阵：expectedB = P^{-1} A P */
export function computeSimilar(A: Matrix, P: Matrix): Matrix {
  return multiply(multiply(inv(P), A), P)
}

export function matricesApproxEqual(a: Matrix, b: Matrix, tol = 1e-6): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false
    for (let j = 0; j < a[i].length; j++) {
      if (Math.abs(a[i][j] - b[i][j]) > tol) return false
    }
  }
  return true
}

export function isIdentity(a: Matrix, tol = 1e-6): boolean {
  return matricesApproxEqual(a, identity(a.length), tol)
}
