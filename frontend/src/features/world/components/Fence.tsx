function FencePost({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[0.16, 0.72, 0.16]} />
      <meshStandardMaterial color="#7a4a28" roughness={0.78} />
    </mesh>
  )
}

function FenceRail({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 0.12, 0.12]} />
      <meshStandardMaterial color="#9a6335" roughness={0.76} />
    </mesh>
  )
}

export default function Fence() {
  const posts: Array<[number, number, number]> = []
  for (let i = -8; i <= 8; i += 1) {
    posts.push([i, 0.36, -11.2], [i, 0.36, 11.2], [-11.2, 0.36, i], [11.2, 0.36, i])
  }

  return (
    <group>
      {posts.map((position, index) => (
        <FencePost key={index} position={position} />
      ))}
      <FenceRail position={[0, 0.48, -11.2]} scale={[22.4, 1, 1]} />
      <FenceRail position={[0, 0.48, 11.2]} scale={[22.4, 1, 1]} />
      <group rotation={[0, Math.PI / 2, 0]}>
        <FenceRail position={[0, 0.48, -11.2]} scale={[22.4, 1, 1]} />
        <FenceRail position={[0, 0.48, 11.2]} scale={[22.4, 1, 1]} />
      </group>
    </group>
  )
}
