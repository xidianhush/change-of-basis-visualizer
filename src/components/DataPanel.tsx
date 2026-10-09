import { BlockMath, InlineMath } from 'react-katex'
import { CheckCircle2, FunctionSquare, XCircle } from 'lucide-react'
import { useLabStore } from '../store/useLabStore'
import { matrixToLatex } from '../lib/latex'
import type { Matrix } from '../lib/matrix'

/** 数据面板中的一张矩阵卡片 */
function MatrixCard({
  title,
  matrix,
  accent,
}: {
  title: string
  matrix: Matrix | null
  accent: string
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />
        <span className="truncate text-[10px] text-slate-400">{title}</span>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-x-auto rounded-md bg-slate-900/60 py-2 text-xs">
        <BlockMath math={matrixToLatex(matrix)} />
      </div>
    </div>
  )
}

export default function DataPanel() {
  const A = useLabStore((s) => s.A)
  const B = useLabStore((s) => s.B)
  const P = useLabStore((s) => s.P)
  const Pinv = useLabStore((s) => s.Pinv)
  const dim = useLabStore((s) => s.dim)
  const similarityHolds = useLabStore((s) => s.similarityHolds)

  const basisLatex =
    dim === 3
      ? 'e_1,e_2,e_3 \\;\\big/\\; b_1,b_2,b_3'
      : 'e_1,e_2 \\;\\big/\\; b_1,b_2'

  return (
    <section className="shrink-0 border-b border-slate-800/80 bg-slate-900/30 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <FunctionSquare className="h-4 w-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-slate-100">数据面板</h2>
        <span className="font-mono text-[11px] text-slate-500">
          相似关系 B = P⁻¹AP
        </span>

        {/* 相似关系状态徽标 */}
        <span
          className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            similarityHolds
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-rose-500/15 text-rose-300'
          }`}
        >
          {similarityHolds ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              满足 B = P⁻¹AP
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              B ≠ P⁻¹AP（自由探索）
            </>
          )}
        </span>
      </div>

      <div className="flex gap-2.5">
        <MatrixCard title="变换矩阵（坐标系1）" matrix={A} accent="bg-cyan-400" />
        <MatrixCard title="变换矩阵（坐标系2）" matrix={B} accent="bg-violet-400" />
        <MatrixCard title="过渡矩阵 P" matrix={P} accent="bg-emerald-400" />
        <MatrixCard title="过渡矩阵之逆 P⁻¹" matrix={Pinv} accent="bg-amber-400" />
        <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span className="truncate text-[10px] text-slate-400">
              基向量（标准 / 新基）
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center rounded-md bg-slate-900/60 py-2 text-xs">
            <InlineMath math={basisLatex} />
          </div>
        </div>
      </div>
    </section>
  )
}
