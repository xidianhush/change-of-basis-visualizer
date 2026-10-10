import { Braces, Crosshair, Eye, EyeOff, Play, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { BlockMath } from 'react-katex'
import { useLabStore, type FieldKey } from '../store/useLabStore'
import { PRESETS } from '../lib/presets'

const FIELD_META: Record<FieldKey, { label: string; symbol: string }> = {
  basis1: { label: '坐标系 1 的基（标准基）', symbol: 'B₁ = I' },
  p: { label: '坐标系 2 的基（过渡矩阵）', symbol: 'P' },
  a: { label: '坐标系 1 下的变换矩阵', symbol: 'A' },
  b: { label: '坐标系 2 下的变换矩阵', symbol: 'B' },
}

/** 单个 LaTeX 矩阵输入字段 */
function MatrixField({ fieldKey }: { fieldKey: FieldKey }) {
  const value = useLabStore((s) => s.latex[fieldKey])
  const setLatex = useLabStore((s) => s.setLatex)
  const error = useLabStore((s) => s.errors[fieldKey])
  const { label, symbol } = FIELD_META[fieldKey]

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-slate-300">{label}</label>
        <span className="font-mono text-[11px] text-cyan-400">{symbol}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setLatex(fieldKey, e.target.value)}
        spellCheck={false}
        rows={3}
        className={`w-full resize-none rounded-lg border bg-slate-950/70 p-2.5 font-mono text-[11px] leading-relaxed text-slate-200 outline-none transition focus:ring-1 ${
          error
            ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-700/80 focus:border-cyan-500/70 focus:ring-cyan-500/30'
        }`}
      />
      {error && (
        <p className="flex items-start gap-1 text-[10px] leading-snug text-rose-400">
          <TriangleAlert className="mt-px h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/** 两个追踪向量输入槽位的文案与配色（v1 金=坐标系1，v2 粉=坐标系2） */
const VECTOR_META = {
  v1: {
    label: '坐标系1 追踪向量 v₁',
    hint: '在坐标系1中：basis1·v₁ → A·basis1·v₁',
    wrap: 'border-amber-500/25 bg-amber-500/5',
    title: 'text-amber-200',
    icon: 'text-amber-400',
    btnOn: 'border-amber-500/50 bg-amber-500/15 text-amber-300',
    field: 'border-amber-500/30 focus:border-amber-500/70 focus:ring-amber-500/25',
  },
  v2: {
    label: '坐标系2 追踪向量 v₂',
    hint: '在坐标系2中：P·v₂ → P·B·v₂',
    wrap: 'border-pink-500/25 bg-pink-500/5',
    title: 'text-pink-200',
    icon: 'text-pink-400',
    btnOn: 'border-pink-500/50 bg-pink-500/15 text-pink-300',
    field: 'border-pink-500/30 focus:border-pink-500/70 focus:ring-pink-500/25',
  },
} as const
type VectorSlot = keyof typeof VECTOR_META

/** 单个追踪向量（基坐标系数）LaTeX 输入字段 */
function VectorField({ slot }: { slot: VectorSlot }) {
  const m = VECTOR_META[slot]
  const value = useLabStore((s) => (slot === 'v1' ? s.v1Latex : s.v2Latex))
  const error = useLabStore((s) => (slot === 'v1' ? s.v1Error : s.v2Error))
  const show = useLabStore((s) => (slot === 'v1' ? s.showV1 : s.showV2))
  const setLatex = useLabStore((s) => (slot === 'v1' ? s.setV1Latex : s.setV2Latex))
  const setShow = useLabStore((s) => (slot === 'v1' ? s.setShowV1 : s.setShowV2))

  return (
    <div className={`space-y-1.5 rounded-lg border p-2.5 ${m.wrap}`}>
      <div className="flex items-center justify-between">
        <label className={`flex items-center gap-1.5 text-xs font-medium ${m.title}`}>
          <Crosshair className={`h-3.5 w-3.5 ${m.icon}`} />
          {m.label}
        </label>
        <button
          type="button"
          onClick={() => setShow(!show)}
          title={show ? '隐藏该追踪向量' : '显示该追踪向量'}
          className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] transition ${
            show ? m.btnOn : 'border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          {show ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {show ? '显示中' : '已隐藏'}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => setLatex(e.target.value)}
        spellCheck={false}
        rows={2}
        className={`w-full resize-none rounded-lg border bg-slate-950/70 p-2 font-mono text-[11px] leading-relaxed text-slate-200 outline-none transition focus:ring-1 ${
          error
            ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30'
            : m.field
        }`}
      />

      <div className="flex items-center justify-center overflow-x-auto rounded-md bg-slate-950/60 py-1 text-xs">
        {error ? (
          <span className="font-mono text-[10px] text-rose-400">向量格式错误</span>
        ) : (
          <BlockMath math={value} />
        )}
      </div>

      {error && (
        <p className="flex items-start gap-1 text-[10px] leading-snug text-rose-400">
          <TriangleAlert className="mt-px h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
      <p className="text-[10px] leading-snug text-slate-500">{m.hint}</p>
    </div>
  )
}

export default function InputPanel() {
  const applyAll = useLabStore((s) => s.applyAll)
  const loadPreset = useLabStore((s) => s.loadPreset)
  const reset = useLabStore((s) => s.reset)
  const globalError = useLabStore((s) => s.errors.global)

  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-slate-800/80 bg-slate-900/40">
      <div className="flex items-center gap-2 border-b border-slate-800/80 px-4 py-3">
        <Braces className="h-4 w-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-slate-100">矩阵输入</h2>
        <span className="ml-auto rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          LaTeX
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <MatrixField fieldKey="basis1" />
        <MatrixField fieldKey="p" />
        <MatrixField fieldKey="a" />
        <MatrixField fieldKey="b" />

        <VectorField slot="v1" />
        <VectorField slot="v2" />

        {/* 预设 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            默认预设（均满足 B = P⁻¹AP）
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`rounded-md border px-2 py-1.5 text-[11px] transition ${
                  preset.dim === 3 ? 'col-span-2' : ''
                } border-slate-700/70 bg-slate-800/40 text-slate-300 hover:border-cyan-500/60 hover:text-cyan-300`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {globalError && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[10px] leading-snug text-amber-300">
            {globalError}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-800/80 p-3">
        <button
          onClick={applyAll}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Play className="h-3.5 w-3.5" />
          解析并应用
        </button>
        <button
          onClick={reset}
          title="重置为 2D 单位矩阵"
          className="flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
