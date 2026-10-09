import { useLabStore } from '../store/useLabStore'
import { identity, multiply } from '../lib/matrix'
import SceneCanvas from './SceneCanvas'
import CanvasErrorBoundary from './CanvasErrorBoundary'

export type Variant = 'c1-before' | 'c1-after' | 'c2-before' | 'c2-after'

function Placeholder({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-1 font-mono text-xs text-slate-600">[ viewport ]</div>
        <div className="text-[10px] text-slate-700">{text}</div>
      </div>
    </div>
  )
}

export default function LabViewport({ variant }: { variant: Variant }) {
  const dim = useLabStore((s) => s.dim)
  const P = useLabStore((s) => s.P)
  const A = useLabStore((s) => s.A)
  const B = useLabStore((s) => s.B)

  // 左上：坐标系 1 变换前 —— 标准基参考网格
  if (variant === 'c1-before') {
    const I = identity(dim)
    return (
      <CanvasErrorBoundary>
        <SceneCanvas
          key={dim}
          dim={dim}
          mapMatrix={I}
          pointColor="#67e8f9"
          frameColor="#0ea5e9"
        />
      </CanvasErrorBoundary>
    )
  }

  // 右上：坐标系 1 变换后 —— 点 = A·标准点，基向量 = A 的列
  if (variant === 'c1-after') {
    if (!A) return <Placeholder text="变换矩阵 A 不可用" />
    return (
      <CanvasErrorBoundary>
        <SceneCanvas
          key={dim}
          dim={dim}
          mapMatrix={A}
          pointColor="#67e8f9"
          frameColor="#0284c7"
        />
      </CanvasErrorBoundary>
    )
  }

  // 左下：坐标系 2 变换前 —— 基坐标点经 v_std = P·v_new 映射
  if (variant === 'c2-before') {
    if (!P) return <Placeholder text="过渡矩阵 P 不可用" />
    return (
      <CanvasErrorBoundary>
        <SceneCanvas
          key={dim}
          dim={dim}
          mapMatrix={P}
          pointColor="#c4b5fd"
          frameColor="#8b5cf6"
        />
      </CanvasErrorBoundary>
    )
  }

  // 右下：坐标系 2 变换后 —— 点 = P·B·新基点，基向量 = P·B 的列
  if (!P || !B) return <Placeholder text="P 或 B 不可用" />
  const PB = multiply(P, B)
  return (
    <CanvasErrorBoundary>
      <SceneCanvas
        key={dim}
        dim={dim}
        mapMatrix={PB}
        pointColor="#c4b5fd"
        frameColor="#7c3aed"
      />
    </CanvasErrorBoundary>
  )
}
