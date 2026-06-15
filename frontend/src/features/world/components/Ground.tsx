export default function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial color="#9bdf8c" />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <ringGeometry args={[1.6, 2.15, 4]} />
        <meshStandardMaterial color="#d7d0c0" />
      </mesh>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[10.8, 11.2, 96]} />
        <meshStandardMaterial color="#78bd6f" />
      </mesh>
    </group>
  )
}
