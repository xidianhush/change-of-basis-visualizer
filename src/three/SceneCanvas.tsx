import { useLayoutEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { CellId } from '../lib/motion'
import AnimatedScene from './AnimatedScene'

/** 2D 正交相机：根据画布宽高比固定可视范围 */
function Fit2D({ viewSize = 3.6 }: { viewSize?: number }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera
    const aspect = size.width / size.height
    cam.left = -viewSize * aspect
    cam.right = viewSize * aspect
    cam.top = viewSize
    cam.bottom = -viewSize
    cam.updateProjectionMatrix()
  }, [camera, size, viewSize])
  return null
}

export default function SceneCanvas({
  dim,
  cell,
  pointColor,
  frameColor,
}: {
  dim: 2 | 3
  cell: CellId
  pointColor: string
  frameColor: string
}) {
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
      />

      {dim === 2 && <Fit2D />}
      <OrbitControls makeDefault enableRotate={dim === 3} enablePan enableZoom />
    </Canvas>
  )
}
