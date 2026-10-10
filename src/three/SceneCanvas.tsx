import { useLayoutEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { CellId } from '../lib/motion'
import AnimatedScene from './AnimatedScene'
import { useLabStore } from '../store/useLabStore'
import { computeGlobalBounds, type Bounds } from '../lib/viewBounds'

/** 非统一模式下 2D 固定可视半高（世界单位） */
const DEFAULT_VIEW_SIZE = 3.6
/** 统一模式在内容包络外预留的边距比例 */
const VIEW_MARGIN = 1.12

type OrbitLike = { target: THREE.Vector3; update: () => void }

/**
 * 相机取景控制：
 * - 2D 正交相机按画布宽高比设置对称 frustum；
 * - 非统一模式使用固定默认视野，各格可自由平移/缩放；
 * - 统一模式四格共用同一「全局内容包络」视野，强制原点居中、zoom 复位，
 *   配合锁定的 OrbitControls，保证同一屏幕坐标在四个格子里像素位置完全一致。
 */
function CameraRig({
  dim,
  uniform,
  bounds,
}: {
  dim: 2 | 3
  uniform: boolean
  bounds: Bounds
}) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null

  useLayoutEffect(() => {
    if (dim === 2) {
      const cam = camera as THREE.OrthographicCamera
      const aspect = size.width / Math.max(size.height, 1)
      const viewSize = uniform
        ? Math.max(bounds.hy, bounds.hx / aspect) * VIEW_MARGIN
        : DEFAULT_VIEW_SIZE
      cam.left = -viewSize * aspect
      cam.right = viewSize * aspect
      cam.top = viewSize
      cam.bottom = -viewSize
      if (uniform) {
        cam.zoom = 1
        cam.position.set(0, 0, 10)
        controls?.target.set(0, 0, 0)
        controls?.update()
      }
      cam.updateProjectionMatrix()
    } else if (uniform) {
      // 3D 透视相机：统一模式复位到相同机位与朝向，保证四格视角一致
      camera.position.set(4, 4, 5)
      controls?.target.set(0, 0, 0)
      controls?.update()
    }
  }, [camera, controls, size, dim, uniform, bounds.hx, bounds.hy, bounds.hz])

  return null
}

export default function SceneCanvas({
  dim,
  cell,
  pointColor,
  frameColor,
  trackColor,
}: {
  dim: 2 | 3
  cell: CellId
  pointColor: string
  frameColor: string
  trackColor: string
}) {
  const uniform = useLabStore((s) => s.uniformView)
  const basis1 = useLabStore((s) => s.basis1)
  const A = useLabStore((s) => s.A)
  const P = useLabStore((s) => s.P)
  const B = useLabStore((s) => s.B)
  const trackV1 = useLabStore((s) => s.trackV1)
  const trackV2 = useLabStore((s) => s.trackV2)

  const bounds = useMemo(
    () => computeGlobalBounds(dim, { basis1, A, P, B }, trackV1, trackV2),
    [dim, basis1, A, P, B, trackV1, trackV2],
  )

  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      {dim === 2 ? (
        <OrthographicCamera makeDefault position={[0, 0, 10]} near={-100} far={100} />
      ) : (
        <PerspectiveCamera
          makeDefault
          position={[4, 4, 5]}
          fov={45}
          near={0.1}
          far={100}
        />
      )}

      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 10, 7]} intensity={0.7} />

      {/* 3D 地面淡网格，辅助判断方位 */}
      {dim === 3 && <gridHelper args={[12, 12, '#1e293b', '#111c2e']} />}

      <AnimatedScene
        dim={dim}
        cell={cell}
        pointColor={pointColor}
        frameColor={frameColor}
        trackColor={trackColor}
      />

      <CameraRig dim={dim} uniform={uniform} bounds={bounds} />
      <OrbitControls
        makeDefault
        enableRotate={dim === 3 && !uniform}
        enablePan={!uniform}
        enableZoom={!uniform}
      />
    </Canvas>
  )
}
