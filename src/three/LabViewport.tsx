import { useLabStore } from '../store/useLabStore'
import SceneCanvas from './SceneCanvas'
import CanvasErrorBoundary from './CanvasErrorBoundary'

export type Variant = 'c1-before' | 'c1-after' | 'c2-before' | 'c2-after'

/**
 * 四宫格统一由时间轴 progress 驱动的复合变换动画驱动：
 *   - c1（坐标系1 / 标准基视角）：屏幕坐标 = M(t)·v
 *   - c2（坐标系2 / 新基视角）：屏幕坐标 = P·M(t)·v_new
 * 同一时刻 c1 两格、c2 两格画面相同，呈现「同一复合过程在两个基视角下的对照」。
 */
export default function LabViewport({ variant }: { variant: Variant }) {
  const dim = useLabStore((s) => s.dim)

  if (variant === 'c1-before' || variant === 'c1-after') {
    return (
      <CanvasErrorBoundary>
        <SceneCanvas
          key={dim}
          dim={dim}
          view="c1"
          pointColor="#67e8f9"
          frameColor={variant === 'c1-before' ? '#0ea5e9' : '#0284c7'}
        />
      </CanvasErrorBoundary>
    )
  }

  return (
    <CanvasErrorBoundary>
      <SceneCanvas
        key={dim}
        dim={dim}
        view="c2"
        pointColor="#c4b5fd"
        frameColor={variant === 'c2-before' ? '#8b5cf6' : '#7c3aed'}
      />
    </CanvasErrorBoundary>
  )
}
