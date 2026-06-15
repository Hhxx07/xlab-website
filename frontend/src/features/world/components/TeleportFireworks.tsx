import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { WorldHotspot } from '../data/hotspots'
import { useWorldStore } from '../store/worldStore'

export default function TeleportFireworks({
  hotspot,
  active,
}: {
  hotspot: WorldHotspot | null
  active: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const player = useRef<THREE.Group>(null)
  const wingLeft = useRef<THREE.Mesh>(null)
  const wingRight = useRef<THREE.Mesh>(null)
  const startedAt = useRef(0)
  const playerPosition = useWorldStore((state) => state.playerPosition)
  const particles = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        angle: (index / 42) * Math.PI * 2,
        speed: 0.9 + (index % 7) * 0.18,
        height: 0.8 + (index % 5) * 0.22,
        color: index % 3 === 0 ? '#fde68a' : index % 3 === 1 ? '#93c5fd' : '#f9a8d4',
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!group.current || !player.current) return
    if (!active) {
      startedAt.current = 0
      group.current.visible = false
      return
    }
    if (!startedAt.current) startedAt.current = clock.elapsedTime

    const age = Math.min(clock.elapsedTime - startedAt.current, 1.35)
    group.current.visible = true
    group.current.position.set(playerPosition[0], 0, playerPosition[2])
    player.current.position.y = age * age * 3.2
    player.current.rotation.y = clock.elapsedTime * 1.8

    const flap = Math.sin(clock.elapsedTime * 18) * 0.24
    if (wingLeft.current) wingLeft.current.rotation.z = 0.78 + flap
    if (wingRight.current) wingRight.current.rotation.z = -0.78 - flap

    group.current.children.forEach((child, index) => {
      if (child === player.current) return
      const particle = particles[index % particles.length]
      const radius = age * particle.speed * 2.4
      child.position.set(
        Math.cos(particle.angle) * radius,
        particle.height + age * 2.2,
        Math.sin(particle.angle) * radius,
      )
      const mesh = child as THREE.Mesh
      const material = mesh.material as THREE.Material & { opacity?: number }
      if (material) material.opacity = Math.max(0, 1 - age / 1.35)
    })
  })

  if (!hotspot) return null

  return (
    <group ref={group} visible={false} position={[hotspot.position[0], 0, hotspot.position[2]]}>
      {particles.map((particle, index) => (
        <mesh key={index}>
          <sphereGeometry args={[0.055 + (index % 3) * 0.018, 8, 8]} />
          <meshBasicMaterial color={particle.color} transparent opacity={0.95} />
        </mesh>
      ))}
      <group ref={player}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.42, 0.9, 0.32]} />
          <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.28} />
        </mesh>
        <mesh position={[0, 1.13, 0]} castShadow>
          <boxGeometry args={[0.42, 0.38, 0.42]} />
          <meshStandardMaterial color="#ffd7b5" />
        </mesh>
        <mesh ref={wingLeft} position={[-0.42, 0.78, 0.08]}>
          <coneGeometry args={[0.34, 0.9, 3]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.88} />
        </mesh>
        <mesh ref={wingRight} position={[0.42, 0.78, 0.08]}>
          <coneGeometry args={[0.34, 0.9, 3]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.88} />
        </mesh>
      </group>
    </group>
  )
}
