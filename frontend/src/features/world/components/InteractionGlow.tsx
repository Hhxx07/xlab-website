import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { WorldHotspot } from '../data/hotspots'

export default function InteractionGlow({ hotspot }: { hotspot: WorldHotspot | null }) {
  const ring = useRef<THREE.Mesh>(null)
  const core = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.08
    if (ring.current) {
      ring.current.scale.setScalar(pulse)
      ring.current.rotation.z += 0.015
    }
    if (core.current) {
      core.current.scale.setScalar(0.92 + Math.sin(clock.elapsedTime * 5) * 0.06)
    }
  })

  if (!hotspot) return null

  return (
    <group position={[hotspot.position[0], 0.08, hotspot.position[2]]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[hotspot.radius * 0.72, hotspot.radius * 0.9, 48]} />
        <meshBasicMaterial color="#fff1a8" transparent opacity={0.62} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={core} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[hotspot.radius * 0.34, 32]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.32} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

