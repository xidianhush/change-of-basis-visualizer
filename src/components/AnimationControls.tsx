import { Pause, Play, RotateCcw, TimerReset } from 'lucide-react'
import { useLabStore } from '../store/useLabStore'
import { phaseOf } from '../lib/motion'

const PHASE_LABEL: Record<1 | 2 | 3, { name: string; formula: string }> = {
  1: { name: '阶段 1', formula: 'I → P' },
  2: { name: '阶段 2', formula: 'P → A·P' },
  3: { name: '阶段 3', formula: 'A·P → P⁻¹·A·P' },
}

export default function AnimationControls() {
  const progress = useLabStore((s) => s.progress)
  const isPlaying = useLabStore((s) => s.isPlaying)
  const togglePlay = useLabStore((s) => s.togglePlay)
  const setProgress = useLabStore((s) => s.setProgress)
  const setPlaying = useLabStore((s) => s.setPlaying)

  const phase = phaseOf(progress)
  const { name, formula } = PHASE_LABEL[phase]

  return (
    <section className="flex shrink-0 items-center gap-3 border-b border-slate-800/80 bg-slate-900/30 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <TimerReset className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-semibold text-slate-200">复合变换动画</span>
      </div>

      {/* 播放 / 暂停 */}
      <button
        onClick={togglePlay}
        title={isPlaying ? '暂停' : '播放'}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
          isPlaying
            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
        }`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      {/* 时间轴滑块 */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={(e) => {
            setProgress(parseFloat(e.target.value))
            setPlaying(false) // 拖动时暂停，便于精确查看
          }}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-400"
        />
        <span className="w-12 text-right font-mono text-[11px] text-slate-300">
          {(progress * 100).toFixed(0)}%
        </span>
      </div>

      {/* 阶段指示 */}
      <span className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/50 px-2.5 py-1">
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
        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:bg-slate-800"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </section>
  )
}
