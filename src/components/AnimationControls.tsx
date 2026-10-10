import { Maximize2, Pause, Play, RotateCcw, Workflow } from 'lucide-react'
import { useLabStore } from '../store/useLabStore'
import { PHASE_COUNT, phaseOf } from '../lib/motion'

const PHASES: { name: string; formula: string }[] = [
  { name: '第1段 · 左上', formula: 'I → basis1' },
  { name: '第2段 · 右上', formula: 'basis1 → A' },
  { name: '第3段 · 左下', formula: 'basis1 → P' },
  { name: '第4段 · 右下', formula: 'P → P·B' },
]

export default function AnimationControls() {
  const progress = useLabStore((s) => s.progress)
  const isPlaying = useLabStore((s) => s.isPlaying)
  const togglePlay = useLabStore((s) => s.togglePlay)
  const setProgress = useLabStore((s) => s.setProgress)
  const setPlaying = useLabStore((s) => s.setPlaying)
  const uniformView = useLabStore((s) => s.uniformView)
  const setUniformView = useLabStore((s) => s.setUniformView)

  const phase = phaseOf(progress)
  const { name, formula } = PHASES[phase]

  return (
    <section className="flex shrink-0 items-center gap-3 border-b border-slate-800/80 bg-slate-900/30 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Workflow className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-semibold text-slate-200">分步复合演示</span>
      </div>

      {/* 播放 / 暂停 */}
      <button
        onClick={togglePlay}
        title={isPlaying ? '暂停' : '播放'}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
          isPlaying
            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
        }`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      {/* 时间轴滑块（四段） */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative flex-1">
          {/* 四段分段刻度底纹 */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex h-1.5 -translate-y-1/2 gap-px">
            {Array.from({ length: PHASE_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full ${
                  i === phase ? 'bg-amber-500/40' : 'bg-slate-700/60'
                }`}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => {
              setProgress(parseFloat(e.target.value))
              setPlaying(false) // 拖动时暂停，便于逐段查看
            }}
            className="relative h-1.5 w-full cursor-pointer appearance-none bg-transparent accent-amber-400"
          />
        </div>
        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-slate-300">
          {(progress * 100).toFixed(0)}%
        </span>
      </div>

      {/* 当前阶段指示 */}
      <span className="flex shrink-0 items-center gap-2 rounded-md border border-slate-700 bg-slate-800/50 px-2.5 py-1">
        <span className="text-[10px] uppercase tracking-wide text-slate-400">{name}</span>
        <span className="font-mono text-[11px] text-amber-300">{formula}</span>
      </span>

      {/* 回到起点 */}
      <button
        onClick={() => {
          setProgress(0)
          setPlaying(false)
        }}
        title="回到起点"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:bg-slate-800"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>

      {/* 统一镜头尺度：四格同一居中视野并锁定平移缩放，便于直接比对同一坐标 */}
      <button
        onClick={() => setUniformView(!uniformView)}
        title="统一四个格子的镜头尺度与原点位置，使同一屏幕坐标在各格像素位置完全一致"
        className={`flex h-7 shrink-0 items-center gap-1 rounded-md border px-2 text-[11px] transition ${
          uniformView
            ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
            : 'border-slate-700 text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Maximize2 className="h-3.5 w-3.5" />
        统一镜头
      </button>
    </section>
  )
}
