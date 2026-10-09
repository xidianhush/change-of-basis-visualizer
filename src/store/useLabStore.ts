import { create } from 'zustand'
import {
  computeSimilar,
  identity,
  inv,
  isIdentity,
  isInvertible,
  type Matrix,
} from '../lib/matrix'
import { matrixToLatex, parseLatexMatrix, ParseError } from '../lib/latex'
import { PRESETS, type Preset } from '../lib/presets'

export type FieldKey = 'basis1' | 'p' | 'a' | 'b'

type Errors = Partial<Record<FieldKey, string>> & { global?: string }

interface LabState {
  dim: 2 | 3
  latex: Record<FieldKey, string>

  basis1: Matrix | null
  P: Matrix | null
  A: Matrix | null
  B: Matrix | null
  Pinv: Matrix | null
  expectedB: Matrix | null

  similarityHolds: boolean
  errors: Errors

  setLatex: (key: FieldKey, value: string) => void
  applyAll: () => void
  loadPreset: (preset: Preset) => void
  reset: () => void
}

const FIELD_LABEL: Record<FieldKey, string> = {
  basis1: '坐标系 1 的基',
  p: '过渡矩阵 P',
  a: '变换矩阵 A',
  b: '变换矩阵 B',
}

/** 由四个矩阵字段计算派生状态 */
function derive(
  parsed: Record<FieldKey, Matrix>,
): Pick<
  LabState,
  | 'dim'
  | 'basis1'
  | 'P'
  | 'A'
  | 'B'
  | 'Pinv'
  | 'expectedB'
  | 'similarityHolds'
  | 'errors'
> {
  const errors: Errors = {}
  const { basis1, p: P, a: A, b: B } = parsed

  // 维度一致性
  const dims = new Set([basis1.length, P.length, A.length, B.length])
  if (dims.size !== 1) {
    errors.global = '四个矩阵的维度不一致，请同时使用 2×2 或 3×3。'
    return {
      dim: basis1.length === 3 || P.length === 3 ? 3 : 2,
      basis1,
      P,
      A,
      B,
      Pinv: null,
      expectedB: null,
      similarityHolds: false,
      errors,
    }
  }

  const dim = P.length as 2 | 3

  if (!isIdentity(basis1)) {
    errors.global = '提示：坐标系 1 的基不是单位矩阵；当前渲染仍按标准正交基处理。'
  }

  if (!isInvertible(P)) {
    errors.p = '过渡矩阵 P 不可逆（行列式为 0），无法计算 P⁻¹。'
    return {
      dim,
      basis1,
      P,
      A,
      B,
      Pinv: null,
      expectedB: null,
      similarityHolds: false,
      errors,
    }
  }

  const Pinv = inv(P)
  const expectedB = computeSimilar(A, P)

  // 与用户输入的 B 逐元素比较
  let similarityHolds = true
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      if (Math.abs(expectedB[i][j] - B[i][j]) > 1e-6) similarityHolds = false
    }
  }

  if (!similarityHolds && !errors.global) {
    errors.global = '自由探索模式：B ≠ P⁻¹AP，两个坐标系的变换结果将出现不一致。'
  }

  return {
    dim,
    basis1,
    P,
    A,
    B,
    Pinv,
    expectedB,
    similarityHolds,
    errors,
  }
}

function matricesToLatexRecord(p: Preset): Record<FieldKey, string> {
  return {
    basis1: matrixToLatex(p.basis1),
    p: matrixToLatex(p.P),
    a: matrixToLatex(p.A),
    b: matrixToLatex(p.B),
  }
}

const initialPreset = PRESETS[0]
const initialLatex = matricesToLatexRecord(initialPreset)
const initialDerived = derive({
  basis1: initialPreset.basis1,
  p: initialPreset.P,
  a: initialPreset.A,
  b: initialPreset.B,
})

export const useLabStore = create<LabState>((set, get) => ({
  ...initialDerived,
  latex: initialLatex,

  setLatex: (key, value) =>
    set((state) => ({ latex: { ...state.latex, [key]: value } })),

  applyAll: () => {
    const { latex } = get()
    const errors: Errors = {}
    const parsed = {} as Record<FieldKey, Matrix>

    ;(Object.keys(FIELD_LABEL) as FieldKey[]).forEach((key) => {
      try {
        parsed[key] = parseLatexMatrix(latex[key])
      } catch (e) {
        errors[key] = e instanceof ParseError ? e.message : `${FIELD_LABEL[key]}解析失败`
      }
    })

    // 存在解析错误：清空派生矩阵，保留文本供继续编辑
    if (Object.keys(errors).length > 0) {
      set({
        basis1: parsed.basis1 ?? null,
        P: parsed.p ?? null,
        A: parsed.a ?? null,
        B: parsed.b ?? null,
        Pinv: null,
        expectedB: null,
        similarityHolds: false,
        errors,
      })
      return
    }

    set(derive(parsed))
  },

  loadPreset: (preset) =>
    set({
      dim: preset.dim,
      latex: matricesToLatexRecord(preset),
      basis1: preset.basis1,
      P: preset.P,
      A: preset.A,
      B: preset.B,
      Pinv: inv(preset.P),
      expectedB: computeSimilar(preset.A, preset.P),
      similarityHolds: true,
      errors: {},
    }),

  reset: () => {
    const I = identity(2)
    set({
      dim: 2,
      latex: {
        basis1: matrixToLatex(I),
        p: matrixToLatex(I),
        a: matrixToLatex(I),
        b: matrixToLatex(I),
      },
      basis1: I,
      P: I,
      A: I,
      B: I,
      Pinv: I,
      expectedB: I,
      similarityHolds: true,
      errors: {},
    })
  },
}))
