import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Matrix } from '../lib/matrix'
import {
  cellEndpoints,
  cellMatrixAt,
  matVecMul,
  trackEndpoints,
  trackVectorAt,
  trackOriginAt,
  type CellId,
} from '../lib/motion'
import { frameEdges, gridPoints, type Segment } from '../lib/referenceGeometry'
import { useLabStore } from '../store/useLabStore'

const ARROW_COLORS = ['#f87171', '#4ade80', '#60a5fa']
const HEAD_LENGTH = 0.16
const HEAD_RADIUS = 0.07

/** 追踪向量箭头尺寸（颜色由各格 trackColor 传入：坐标系1金、坐标系2粉） */
const TRACK_HEAD_LENGTH = 0.2
const TRACK_HEAD_RADIUS = 0.095

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

/** 将一个沿 +Y 建模的箭头缩放并朝向目标向量 (x,y,z) */
function placeTrackArrow(refs: ArrowRefs, x: number, y: number, z: number) {
  const length = Math.hypot(x, y, z)
  if (!refs.group || !refs.shaft || !refs.cone) return
  if (length < 1e-6) {
    refs.group.visible = false
    return
  }
  refs.group.visible = true
  TMP_V.set(x / length, y / length, z / length)
  TMP_Q.setFromUnitVectors(UP, TMP_V)
  refs.group.quaternion.copy(TMP_Q)
  const shaftLength = Math.max(length - TRACK_HEAD_LENGTH, 0)
  refs.shaft.scale.y = shaftLength
  refs.shaft.position.y = shaftLength / 2
  refs.cone.position.y = shaftLength + TRACK_HEAD_LENGTH / 2
}

function vec3(v: number[], dim: 2 | 3): [number, number, number] {
  return [v[0], v[1], dim === 3 ? v[2] : 0]
}

export default function AnimatedScene({
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
  const basePoints = useMemo(() => gridPoints(dim), [dim])
  const baseEdges = useMemo(() => frameEdges(dim), [dim])

  // 订阅低频变化的矩阵（解析 / 预设切换才更新）；progress 不走 React 渲染路径
  const basis1 = useLabStore((s) => s.basis1)
  const A = useLabStore((s) => s.A)
  const P = useLabStore((s) => s.P)
  const B = useLabStore((s) => s.B)
  // 追踪向量 / 开关在渲染循环中通过 getState() 每帧读取，无需订阅触发重渲染

  // 该格的动画起止矩阵（仅随输入矩阵变化重算）
  const endpoints = useMemo(
    () => cellEndpoints(cell, dim, { basis1, A, P, B }),
    [cell, dim, basis1, A, P, B],
  )

  // 追踪向量专用的起止矩阵（右上终点为 A·basis1，右下终点为 P·B）
  const trackEp = useMemo(
    () => trackEndpoints(cell, dim, { basis1, A, P, B }),
    [cell, dim, basis1, A, P, B],
  )

  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const arrowRefs = useRef<ArrowRefs[]>(
    Array.from({ length: dim }, () => ({ group: null, shaft: null, cone: null })),
  )

  // 追踪向量相关对象
  const trackGroupRef = useRef<THREE.Group>(null)
  const trackArrow = useRef<ArrowRefs>({ group: null, shaft: null, cone: null })
  const trackTipRef = useRef<THREE.Mesh>(null)
  const trackDashRef = useRef<THREE.LineSegments>(null)
  const dashPositions = useMemo(() => new Float32Array(6), [])

  // 初始 position 缓冲（规范点，t=0 起点）
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

  /** 依据当前屏幕矩阵把几何写入 three 对象（渲染循环高频调用） */
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

  // 渲染循环：实时读取滑块进度，仅在该格所属段内插值，其余时间保持首/尾态
  useFrame(() => {
    const state = useLabStore.getState()
    writeFrame(cellMatrixAt(endpoints, state.progress))

    // 追踪向量：坐标系1两格用 v1（金），坐标系2两格用 v2（粉）
    // 实线=当前向量，虚线=该格变换前向量，小球=终点
    const grp = trackGroupRef.current
    if (grp) {
      const isC1 = cell === 'c1-before' || cell === 'c1-after'
      const v = isC1 ? state.trackV1 : state.trackV2
      const show = isC1 ? state.showV1 : state.showV2
      const valid = !!show && !!v && v.length === dim
      grp.visible = valid
      if (valid && v) {
        const cur = trackVectorAt(trackEp, v, state.progress)
        const org = trackOriginAt(trackEp, v)
        const [cx, cy, cz] = vec3(cur, dim)
        const [ox, oy, oz] = vec3(org, dim)

        placeTrackArrow(trackArrow.current, cx, cy, cz)
        if (trackTipRef.current) trackTipRef.current.position.set(cx, cy, cz)

        if (trackDashRef.current) {
          const attr = trackDashRef.current.geometry.getAttribute(
            'position',
          ) as THREE.BufferAttribute
          attr.setXYZ(1, ox, oy, oz)
          attr.needsUpdate = true
          trackDashRef.current.computeLineDistances()
        }
      }
    }
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
      {Array.from({ length: dim }).map((_, k) => (
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
      ))}

      {/* 追踪向量（颜色随坐标系）：虚线=该格变换前，实线箭头=当前，小球=终点 */}
      <group ref={trackGroupRef} visible={false}>
        <lineSegments ref={trackDashRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[dashPositions, 3]} />
          </bufferGeometry>
          <lineDashedMaterial
            color={trackColor}
            dashSize={0.13}
            gapSize={0.08}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </lineSegments>

        <group
          ref={(el) => {
            trackArrow.current.group = el
          }}
        >
          <mesh
            position={[0, 0.5, 0]}
            ref={(el) => {
              trackArrow.current.shaft = el
            }}
          >
            <cylinderGeometry args={[0.032, 0.032, 1, 14]} />
            <meshStandardMaterial
              color={trackColor}
              emissive={trackColor}
              emissiveIntensity={0.35}
            />
          </mesh>
          <mesh
            position={[0, TRACK_HEAD_LENGTH / 2, 0]}
            ref={(el) => {
              trackArrow.current.cone = el
            }}
          >
            <coneGeometry args={[TRACK_HEAD_RADIUS, TRACK_HEAD_LENGTH, 18]} />
            <meshStandardMaterial
              color={trackColor}
              emissive={trackColor}
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>

        <mesh ref={trackTipRef}>
          <sphereGeometry args={[0.065, 18, 18]} />
          <meshStandardMaterial
            color={trackColor}
            emissive={trackColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  )
}
