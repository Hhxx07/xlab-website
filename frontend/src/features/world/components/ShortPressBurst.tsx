import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { WorldHotspot } from '../data/hotspots'

export default function ShortPressBurst({
  hotspot,
  pulseKey,
}: {
  hotspot: WorldHotspot | null
  pulseKey: number
}) {
  const group = useRef<THREE.Group>(null)
  const startedAt = useRef(0)

  useEffect(() => {
    if (pulseKey > 0) startedAt.current = performance.now()
  }, [pulseKey])

  useFrame(() => {
    if (!group.current || !startedAt.current) return
    const age = (performance.now() - startedAt.current) / 520
    const visible = age >= 0 && age <= 1
    group.current.visible = visible
    if (!visible) return
    const scale = 0.8 + age * 1.8
    group.current.scale.set(scale, scale, scale)
    group.current.children.forEach((child) => {
      const material = (child as THREE.Mesh).material as THREE.Material & { opacity?: number }
      if (material) material.opacity = 1 - age
    })
  })

  if (!hotspot || pulseKey === 0) return null

  return (
    <group ref={group} position={[hotspot.position[0], 0.16, hotspot.position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[hotspot.radius * 0.62, 0.035, 8, 48]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[hotspot.radius * 0.36, 0.025, 8, 48]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.72} />
      </mesh>
    </group>
  )
}
