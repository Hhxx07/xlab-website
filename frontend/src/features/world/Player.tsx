import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { MutableRefObject } from 'react'
import type { MovementInput } from './utils/isoDirection'
import { getIsoMovement } from './utils/isoDirection'
import { clampTownPosition } from './utils/distance'
import { useWorldStore } from './store/worldStore'

export default function Player({
  controls,
}: {
  controls: MutableRefObject<MovementInput>
}) {
  const group = useRef<THREE.Group>(null)
  const position = useWorldStore((state) => state.playerPosition)
  const setPlayerPosition = useWorldStore((state) => state.setPlayerPosition)
  const movementEnabled = useWorldStore((state) => state.movementEnabled)

  useFrame((_, delta) => {
    if (!group.current) return

    const direction = movementEnabled ? getIsoMovement(controls.current) : { x: 0, z: 0 }
    const speed = 4.4
    const next: [number, number, number] = [
      position[0] + direction.x * speed * delta,
      0,
      position[2] + direction.z * speed * delta,
    ]
    const clamped = clampTownPosition(next)

    if (direction.x !== 0 || direction.z !== 0) {
      setPlayerPosition(clamped)
    }

    group.current.position.lerp(new THREE.Vector3(clamped[0], 0, clamped[2]), 0.35)
    if (direction.x !== 0 || direction.z !== 0) {
      group.current.rotation.y = Math.atan2(direction.x, direction.z)
    }
  })

  return (
    <group ref={group} position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.42, 0.7, 0.32]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[0.45, 0.42, 0.42]} />
        <meshStandardMaterial color="#ffd7b5" />
      </mesh>
      <mesh position={[-0.14, 0.06, 0]} castShadow>
        <boxGeometry args={[0.14, 0.28, 0.16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.14, 0.06, 0]} castShadow>
        <boxGeometry args={[0.14, 0.28, 0.16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.46]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  )
}
