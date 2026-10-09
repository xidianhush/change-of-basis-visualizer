import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { identity, type Matrix } from '../lib/matrix'
import { buildMotion, matMul, matVecMul, motionMatrix } from '../lib/motion'
import { frameEdges, gridPoints, type Segment } from '../lib/referenceGeometry'
import { useLabStore } from '../store/useLabStore'

const ARROW_COLORS = ['#f87171', '#4ade80', '#60a5fa']
const HEAD_LENGTH = 0.16
const HEAD_RADIUS = 0.07

export type ViewSpace = 'c1' | 'c2'

type ArrowRefs = {
  group: THREE.Group | null
  shaft: THREE.Mesh | null
  cone: THREE.Mesh | null
}

function column(m: Matrix, k: number, dim: 2 | 3): [number, number, number] {
  return [m[0][k], m[1][k], dim === 3 ? m[2][k] : 0]
}

const UP = new THREE.Vector3(0, 1, 0)
const TMP_Q = new THREE.Quaternion()
const TMP_V = new THREE.Vector3()

export default function AnimatedScene({
  dim,
  view,
  pointColor,
  frameColor,
}: {
  dim: 2 | 3
  view: ViewSpace
  pointColor: string
  frameColor: string
}) {
  const basePoints = useMemo(() => gridPoints(dim), [dim])
  const baseEdges = useMemo(() => frameEdges(dim), [dim])

  // 订阅低频变化的矩阵（解析/预设切换时才更新）；progress 不走 React 路径
  const P = useLabStore((s) => s.P)
  const A = useLabStore((s) => s.A)
  const Pinv = useLabStore((s) => s.Pinv)

  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const arrowRefs = useRef<ArrowRefs[]>(
    Array.from({ length: dim }, () => ({ group: null, shaft: null, cone: null })),
  )

  // 初始 position 缓冲（规范点）
  const pointPositions = useMemo(() => {
    const arr = new Float32Array(basePoints.length * 3)
    basePoints.forEach((p, i) => {
      arr[i * 3] = p[0]
      arr[i * 3 + 1] = p[1]
      arr[i * 3 + 2] = dim === 3 ? p[2] : 0
    })
    return arr
  }, [basePoints, dim])

  const linePositions = useMemo(() => {
    const arr = new Float32Array(baseEdges.length * 2 * 3)
    baseEdges.forEach(([a, b], i) => {
      arr[i * 6] = a[0]
      arr[i * 6 + 1] = a[1]
      arr[i * 6 + 2] = dim === 3 ? a[2] : 0
      arr[i * 6 + 3] = b[0]
      arr[i * 6 + 4] = b[1]
      arr[i * 6 + 5] = dim === 3 ? b[2] : 0
    })
    return arr
  }, [baseEdges, dim])

  // 缓存复合路径的三步关键矩阵（仅当 P / A / P⁻¹ 变化时重算）
  const motion = useMemo(
    () => buildMotion(P ?? identity(dim), A ?? identity(dim), Pinv ?? identity(dim)),
    [P, A, Pinv, dim],
  )

  /** 依据当前矩阵把几何写入 three 对象（渲染循环高频调用） */
  function writeFrame(cur: Matrix) {
    // 点云
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      basePoints.forEach((p, i) => {
        const q = matVecMul(cur, p)
        attr.setXYZ(i, q[0], q[1], dim === 3 ? q[2] : 0)
      })
      attr.needsUpdate = true
    }

    // 线框
    if (linesRef.current) {
      const attr = linesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      baseEdges.forEach((seg: Segment, i) => {
        const a = matVecMul(cur, seg[0])
        const b = matVecMul(cur, seg[1])
        attr.setXYZ(i * 2, a[0], a[1], dim === 3 ? a[2] : 0)
        attr.setXYZ(i * 2 + 1, b[0], b[1], dim === 3 ? b[2] : 0)
      })
      attr.needsUpdate = true
    }

    // 基向量箭头 = 当前矩阵的列
    for (let k = 0; k < dim; k++) {
      const refs = arrowRefs.current[k]
      if (!refs.group || !refs.shaft || !refs.cone) continue
      const [x, y, z] = column(cur, k, dim)
      const length = Math.hypot(x, y, z)
      if (length < 1e-6) {
        refs.group.visible = false
        continue
      }
      refs.group.visible = true
      TMP_V.set(x / length, y / length, z / length)
      TMP_Q.setFromUnitVectors(UP, TMP_V)
      refs.group.quaternion.copy(TMP_Q)
      const shaftLength = Math.max(length - HEAD_LENGTH, 0)
      refs.shaft.scale.y = shaftLength
      refs.shaft.position.y = shaftLength / 2
      refs.cone.position.y = shaftLength + HEAD_LENGTH / 2
    }
  }

  // 渲染循环：实时读取 progress → 计算 M(t) → 按视角映射 → 写几何
  useFrame(() => {
    const { progress } = useLabStore.getState()
    const M = motionMatrix(motion, progress)
    // 坐标系2 视角需先映射回标准基：P·M(t)·v_new
    const map = view === 'c2' ? matMul(motion.P, M) : M
    writeFrame(map)
  })

  return (
    <group>
      {/* 点云 */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={pointColor}
          size={dim === 3 ? 0.09 : 6}
          sizeAttenuation={dim === 3}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </points>

      {/* 线框 */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={frameColor} transparent opacity={0.55} />
      </lineSegments>

      {/* 基向量箭头 */}
      {Array.from({ length: dim }).map((_, k) => {
        return (
          <group
            key={k}
            ref={(el) => {
              arrowRefs.current[k].group = el
            }}
          >
            <mesh
              position={[0, 0.5, 0]}
              ref={(el) => {
                arrowRefs.current[k].shaft = el
              }}
            >
              <cylinderGeometry args={[0.02, 0.02, 1, 12]} />
              <meshStandardMaterial
                color={ARROW_COLORS[k]}
                emissive={ARROW_COLORS[k]}
                emissiveIntensity={0.25}
              />
            </mesh>
            <mesh
              position={[0, HEAD_LENGTH / 2, 0]}
              ref={(el) => {
                arrowRefs.current[k].cone = el
              }}
            >
              <coneGeometry args={[HEAD_RADIUS, HEAD_LENGTH, 16]} />
              <meshStandardMaterial
                color={ARROW_COLORS[k]}
                emissive={ARROW_COLORS[k]}
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
