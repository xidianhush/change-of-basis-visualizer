import { Box, Boxes, Layers, MoveRight } from 'lucide-react'
import InputPanel from './components/InputPanel'
import DataPanel from './components/DataPanel'
import ViewCell from './components/ViewCell'
import LabViewport, { type Variant } from './three/LabViewport'
import { useLabStore } from './store/useLabStore'

const VIEWS: {
  title: string
  subtitle: string
  icon: typeof Layers
  accent: string
  ring: string
  variant: Variant
}[] = [
  {
    title: '坐标系 1 · 变换前',
    subtitle: '标准基 · 参考点',
    icon: Layers,
    accent: 'text-cyan-400',
    ring: 'border-slate-800',
    variant: 'c1-before',
  },
  {
    title: '坐标系 1 · 变换后',
    subtitle: '应用 A',
    icon: MoveRight,
    accent: 'text-cyan-300',
    ring: 'border-cyan-900/50',
    variant: 'c1-after',
  },
  {
    title: '坐标系 2 · 变换前',
    subtitle: '基 P · 参考点',
    icon: Box,
    accent: 'text-violet-400',
    ring: 'border-violet-900/40',
    variant: 'c2-before',
  },
  {
    title: '坐标系 2 · 变换后',
    subtitle: 'P·B 映射回标准基',
    icon: Boxes,
    accent: 'text-violet-300',
    ring: 'border-violet-900/50',
    variant: 'c2-after',
  },
]

export default function App() {
  const dim = useLabStore((s) => s.dim)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* 顶部标题栏 */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800/80 bg-slate-900/50 px-4 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-bold text-white">
          Σ
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-slate-100">
            基变换与相似矩阵可视化实验室
          </h1>
          <p className="font-mono text-[10px] leading-tight text-slate-500">
            Change of Basis & Similar Matrices · B = P⁻¹AP
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1 font-mono text-[10px] text-slate-300">
            维度：{dim}D
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <InputPanel />

        <main className="flex min-w-0 flex-1 flex-col">
          <DataPanel />

          {/* 四宫格 2×2，每个视口独立 Canvas、共享 zustand 状态 */}
          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3 p-3">
            {VIEWS.map(({ variant, ...cellProps }) => (
              <ViewCell key={cellProps.title} {...cellProps} dim={dim}>
                <LabViewport variant={variant} />
              </ViewCell>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
