import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type ViewCellProps = {
  title: string
  subtitle: string
  icon: LucideIcon
  accent: string
  ring: string
  dim: 2 | 3
  children?: ReactNode
}

const LEGEND: [string, string][] = [
  ['#f87171', 'e₁'],
  ['#4ade80', 'e₂'],
  ['#60a5fa', 'e₃'],
]

/** 四宫格中的单个视口 */
export default function ViewCell({
  title,
  subtitle,
  icon: Icon,
  accent,
  ring,
  dim,
  children,
}: ViewCellProps) {
  return (
    <div
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-xl border bg-slate-950/40 ${ring}`}
    >
      <div className="flex items-center gap-2 border-b border-slate-800/70 px-3 py-2">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span className="text-xs font-medium text-slate-200">{title}</span>
        <span className="ml-auto font-mono text-[10px] text-slate-500">{subtitle}</span>
      </div>

      <div className="relative flex-1">
        {children ?? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-1 font-mono text-xs text-slate-600">[ viewport ]</div>
              <div className="text-[10px] text-slate-700">等待渲染器挂载</div>
            </div>
          </div>
        )}

        {/* 基向量颜色图例 */}
        <div className="pointer-events-none absolute bottom-2 left-2 flex gap-2 rounded bg-slate-950/60 px-2 py-1 backdrop-blur-sm">
          {LEGEND.slice(0, dim).map(([color, label]) => (
            <span key={label} className="flex items-center gap-1 text-[9px] text-slate-400">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
