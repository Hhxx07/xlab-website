import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { MutableRefObject } from 'react'
import type { MovementInput } from './utils/isoDirection'
import { clampTownPosition } from './utils/distance'
import { useWorldStore } from './store/worldStore'

export default function Player({
  controls,
}: {
  controls: MutableRefObject<MovementInput>
}) {
  const group = useRef<THREE.Group>(null)
  const initialPosition = useRef(useWorldStore.getState().playerPosition)
  const positionRef = useRef<[number, number, number]>([...initialPosition.current])
  const targetPosition = useRef(
    new THREE.Vector3(
      initialPosition.current[0],
      initialPosition.current[1],
      initialPosition.current[2],
    ),
  )
  const facingAngle = useRef(Math.atan2(useWorldStore.getState().playerDirection[0], useWorldStore.getState().playerDirection[2]))
  const setPlayerPosition = useWorldStore((state) => state.setPlayerPosition)
  const setPlayerDirection = useWorldStore((state) => state.setPlayerDirection)
  const movementEnabled = useWorldStore((state) => state.movementEnabled)

  useFrame((_, delta) => {
    if (!group.current) return

    const turnInput = movementEnabled
      ? Number(controls.current.right) - Number(controls.current.left)
      : 0
    const moveInput = movementEnabled
      ? Number(controls.current.up) - Number(controls.current.down)
      : 0

    const turnSpeed = 2.45
    if (turnInput !== 0) {
      facingAngle.current -= turnInput * turnSpeed * delta
    }

    const direction = {
      x: Math.sin(facingAngle.current) * moveInput,
      z: Math.cos(facingAngle.current) * moveInput,
    }
    const speed = 4.4
    const next: [number, number, number] = [
      positionRef.current[0] + direction.x * speed * delta,
      0,
      positionRef.current[2] + direction.z * speed * delta,
    ]
    const clamped = clampTownPosition(next)

    const facingDirection: [number, number, number] = [
      Math.sin(facingAngle.current),
      0,
      Math.cos(facingAngle.current),
    ]
    setPlayerDirection(facingDirection)

    if (moveInput !== 0) {
      positionRef.current = clamped
      setPlayerPosition(clamped)
    }

    targetPosition.current.set(clamped[0], 0, clamped[2])
    group.current.position.lerp(targetPosition.current, 0.35)
    group.current.rotation.y = facingAngle.current
  })

  return (
    <group ref={group} position={initialPosition.current}>
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
