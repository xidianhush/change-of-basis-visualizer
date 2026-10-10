import { create } from 'zustand'
import {
  computeSimilar,
  identity,
  inv,
  isIdentity,
  isInvertible,
  type Matrix,
} from '../lib/matrix'
import {
  matrixToLatex,
  parseLatexMatrix,
  parseLatexVector,
  vectorToLatex,
  ParseError,
} from '../lib/latex'
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

  /** 时间轴：复合演示进度 0~1 与播放状态 */
  progress: number
  isPlaying: boolean

  /** 追踪向量：v1 属于坐标系1，v2 属于坐标系2（均为各自基下的坐标系数） */
  v1Latex: string
  trackV1: number[] | null
  v1Error: string | null
  showV1: boolean
  v2Latex: string
  trackV2: number[] | null
  v2Error: string | null
  showV2: boolean

  setLatex: (key: FieldKey, value: string) => void
  applyAll: () => void
  loadPreset: (preset: Preset) => void
  reset: () => void
  setProgress: (t: number) => void
  setPlaying: (on: boolean) => void
  togglePlay: () => void
  setV1Latex: (value: string) => void
  setV2Latex: (value: string) => void
  setShowV1: (on: boolean) => void
  setShowV2: (on: boolean) => void
  /** 统一镜头：四格使用同一居中视野并锁定平移缩放，便于直接比对同一坐标 */
  uniformView: boolean
  setUniformView: (on: boolean) => void
}

/** 坐标系1 默认追踪向量：2D [2;3]，3D [2;3;1] */
export function defaultV1(dim: 2 | 3): number[] {
  return dim === 3 ? [2, 3, 1] : [2, 3]
}

/** 坐标系2 默认追踪向量：2D [1;2]，3D [1;2;1] */
export function defaultV2(dim: 2 | 3): number[] {
  return dim === 3 ? [1, 2, 1] : [1, 2]
}

export function defaultV1Latex(dim: 2 | 3): string {
  return vectorToLatex(defaultV1(dim))
}

export function defaultV2Latex(dim: 2 | 3): string {
  return vectorToLatex(defaultV2(dim))
}

/** 解析单个追踪向量 LaTeX，维度不匹配 / 语法错误时返回 value=null 与错误信息 */
function resolveSlot(
  latex: string,
  dim: 2 | 3,
): { value: number[] | null; error: string | null } {
  try {
    return { value: parseLatexVector(latex, dim), error: null }
  } catch (e) {
    return { value: null, error: e instanceof ParseError ? e.message : '向量解析失败' }
  }
}

/** 一次解析两个追踪向量，返回可直接展开进 store 的字段 */
function resolveBoth(v1Latex: string, v2Latex: string, dim: 2 | 3) {
  const a = resolveSlot(v1Latex, dim)
  const b = resolveSlot(v2Latex, dim)
  return { trackV1: a.value, v1Error: a.error, trackV2: b.value, v2Error: b.error }
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
const initialV1Latex = defaultV1Latex(initialDerived.dim)
const initialV2Latex = defaultV2Latex(initialDerived.dim)
const initialVectors = resolveBoth(initialV1Latex, initialV2Latex, initialDerived.dim)

export const useLabStore = create<LabState>((set, get) => ({
  ...initialDerived,
  latex: initialLatex,
  progress: 0,
  isPlaying: false,
  v1Latex: initialV1Latex,
  v2Latex: initialV2Latex,
  showV1: true,
  showV2: true,
  ...initialVectors,
  uniformView: false,
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
        progress: 0,
        errors,
        ...resolveBoth(get().v1Latex, get().v2Latex, get().dim),
      })
      return
    }

    set((s) => {
      const d = derive(parsed)
      return { ...d, progress: 0, ...resolveBoth(s.v1Latex, s.v2Latex, d.dim) }
    })
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
      progress: 0,
      v1Latex: defaultV1Latex(preset.dim),
      v2Latex: defaultV2Latex(preset.dim),
      trackV1: defaultV1(preset.dim),
      trackV2: defaultV2(preset.dim),
      v1Error: null,
      v2Error: null,
      showV1: true,
      showV2: true,
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
      progress: 0,
      isPlaying: false,
      v1Latex: defaultV1Latex(2),
      v2Latex: defaultV2Latex(2),
      trackV1: defaultV1(2),
      trackV2: defaultV2(2),
      v1Error: null,
      v2Error: null,
      showV1: true,
      showV2: true,
    })
  },

  setProgress: (t) => set({ progress: Math.min(Math.max(t, 0), 1) }),

  setPlaying: (on) => set({ isPlaying: on }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setV1Latex: (value) =>
    set((s) => {
      const r = resolveSlot(value, s.dim)
      return { v1Latex: value, trackV1: r.value, v1Error: r.error }
    }),

  setV2Latex: (value) =>
    set((s) => {
      const r = resolveSlot(value, s.dim)
      return { v2Latex: value, trackV2: r.value, v2Error: r.error }
    }),

  setShowV1: (on) => set({ showV1: on }),
  setShowV2: (on) => set({ showV2: on }),

  setUniformView: (on) => set({ uniformView: on }),
}))
