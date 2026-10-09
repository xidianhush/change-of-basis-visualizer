import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Matrix } from '../lib/matrix'
import {
  frameEdges,
  gridPoints,
  transformPoint,
  type Segment,
} from '../lib/referenceGeometry'

const ARROW_COLORS = ['#f87171', '#4ade80', '#60a5fa']
const HEAD_LENGTH = 0.16
const HEAD_RADIUS = 0.07
const DURATION = 700 // 补间时长（毫秒），墙钟确定、帧率无关

type ArrowRefs = {
  group: THREE.Group | null
  shaft: THREE.Mesh | null
  cone: THREE.Mesh | null
}

function cloneMatrix(m: Matrix): Matrix {
  return m.map((row) => [...row])
}

function column(m: Matrix, k: number, dim: 2 | 3): [number, number, number] {
  return [m[0][k], m[1][k], dim === 3 ? m[2][k] : 0]
}

const UP = new THREE.Vector3(0, 1, 0)
const TMP_Q = new THREE.Quaternion()
const TMP_V = new THREE.Vector3()

export default function AnimatedScene({
  dim,
  targetMap,
  pointColor,
  frameColor,
}: {
  dim: 2 | 3
  targetMap: Matrix
  pointColor: string
  frameColor: string
}) {
  const basePoints = useMemo(() => gridPoints(dim), [dim])
  const baseEdges = useMemo(() => frameEdges(dim), [dim])

  // 当前显示矩阵：入场时从单位矩阵开始，之后保持并持续向目标 lerp
  const currentRef = useRef<Matrix>(
    cloneMatrix(
      useMemo(() => {
        const I: Matrix = Array.from({ length: dim }, () => new Array(dim).fill(0))
        for (let i = 0; i < dim; i++) I[i][i] = 1
        return I
      }, [dim]),
    ),
  )

  const targetRef = useRef(targetMap)
  const startRef = useRef<Matrix | null>(null)
  const startTimeRef = useRef(0)

  // 目标矩阵变化时，以当前显示值为起点开启一次时间确定的补间
  useEffect(() => {
    startRef.current = cloneMatrix(currentRef.current)
    startTimeRef.current = performance.now()
    targetRef.current = targetMap
  }, [targetMap])

  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const arrowRefs = useRef<ArrowRefs[]>(
    Array.from({ length: dim }, () => ({ group: null, shaft: null, cone: null })),
  )

  // 初始 position 缓冲（按单位矩阵 = 规范点）
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

  /** 依据当前矩阵把几何写入 three 对象 */
  function writeFrame(cur: Matrix) {
    // 点云
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      basePoints.forEach((p, i) => {
        const q = transformPoint(cur, p)
        attr.setXYZ(i, q[0], q[1], dim === 3 ? q[2] : 0)
      })
      attr.needsUpdate = true
    }

    // 线框
    if (linesRef.current) {
      const attr = linesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      baseEdges.forEach((seg: Segment, i) => {
        const a = transformPoint(cur, seg[0])
        const b = transformPoint(cur, seg[1])
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

  useFrame(() => {
    const target = targetRef.current
    const start = startRef.current
    const cur = currentRef.current

    if (start) {
      const p = Math.min((performance.now() - startTimeRef.current) / DURATION, 1)
      // easeInOutCubic
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          cur[i][j] = start[i][j] + (target[i][j] - start[i][j]) * e
        }
      }
      if (p >= 1) startRef.current = null
    } else {
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) cur[i][j] = target[i][j]
      }
    }
    writeFrame(cur)
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
        const [x, y, z] = column(
          currentRef.current,
          k,
          dim,
        )
        const length = Math.hypot(x, y, z) || 1
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
              position={[
                0,
                Math.max(length - HEAD_LENGTH, 0) + HEAD_LENGTH / 2,
                0,
              ]}
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
