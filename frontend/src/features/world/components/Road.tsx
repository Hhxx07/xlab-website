export default function Road() {
  const roads = [
    { position: [0, 0.035, 0] as [number, number, number], scale: [1.2, 1, 12] as [number, number, number] },
    { position: [0, 0.04, 0] as [number, number, number], scale: [12, 1, 1.2] as [number, number, number] },
  ]

  return (
    <group>
      {roads.map((road, index) => (
        <mesh key={index} position={road.position} scale={road.scale} receiveShadow>
          <boxGeometry args={[1, 0.05, 1]} />
          <meshStandardMaterial color="#c9c0ad" />
        </mesh>
      ))}
      {Array.from({ length: 18 }).map((_, index) => {
        const offset = -5 + (index % 9) * 1.25
        const vertical = index < 9
        return (
          <mesh
            key={index}
            position={vertical ? [0.34, 0.08, offset] : [offset, 0.08, -0.34]}
            rotation={[0, vertical ? 0.2 : -0.2, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.28, 0.05, 0.22]} />
            <meshStandardMaterial color="#e6dfd0" />
          </mesh>
        )
      })}
    </group>
  )
}
