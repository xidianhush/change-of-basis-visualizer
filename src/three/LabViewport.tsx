import { useLabStore } from '../store/useLabStore'
import type { CellId } from '../lib/motion'
import SceneCanvas from './SceneCanvas'
import CanvasErrorBoundary from './CanvasErrorBoundary'

export type Variant = CellId

const CELL_STYLE: Record<
  CellId,
  { pointColor: string; frameColor: string; trackColor: string }
> = {
  'c1-before': { pointColor: '#67e8f9', frameColor: '#0ea5e9', trackColor: '#fbbf24' },
  'c1-after': { pointColor: '#67e8f9', frameColor: '#0284c7', trackColor: '#fbbf24' },
  'c2-before': { pointColor: '#c4b5fd', frameColor: '#8b5cf6', trackColor: '#f472b6' },
  'c2-after': { pointColor: '#c4b5fd', frameColor: '#7c3aed', trackColor: '#f472b6' },
}

/**
 * 四宫格各自是复合演示的一个独立阶段，由全局滑块 progress 分段驱动：
 *   左上 I→basis1 / 右上 basis1→A / 左下 basis1→P / 右下 P→P·B。
 * 每格只在自己所属段内动画，矩阵缺失时由 motion 层以单位矩阵兜底。
 * 坐标系1两格追踪 v1（金），坐标系2两格追踪 v2（粉）。
 */
export default function LabViewport({ variant }: { variant: Variant }) {
  const dim = useLabStore((s) => s.dim)
  const { pointColor, frameColor, trackColor } = CELL_STYLE[variant]

  return (
    <CanvasErrorBoundary>
      <SceneCanvas
        key={dim}
        dim={dim}
        cell={variant}
        pointColor={pointColor}
        frameColor={frameColor}
        trackColor={trackColor}
      />
    </CanvasErrorBoundary>
  )
}
