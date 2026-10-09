import { Braces, Play, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
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
