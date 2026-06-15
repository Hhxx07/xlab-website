import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { WorldHotspot } from '../data/hotspots'

export default function TeleportAura({
  hotspot,
  progress,
  active,
}: {
  hotspot: WorldHotspot | null
  progress: number
  active: boolean
}) {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.rotation.y = clock.elapsedTime * 1.8
  })

  if (!hotspot || progress <= 0) return null
  const radius = hotspot.radius * (0.7 + progress * 1.4)
  const opacity = active ? 0.72 : 0.32

  return (
    <group ref={group} position={[hotspot.position[0], 0.12, hotspot.position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.045, 10, 72]} />
        <meshBasicMaterial color={active ? '#93c5fd' : '#fef3c7'} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.85 + progress * 0.9, 0]}>
        <cylinderGeometry args={[radius * 0.26, radius * 0.72, 1.7 + progress * 1.2, 32, 1, true]} />
        <meshBasicMaterial color={active ? '#60a5fa' : '#fbbf24'} transparent opacity={0.18 + progress * 0.16} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
