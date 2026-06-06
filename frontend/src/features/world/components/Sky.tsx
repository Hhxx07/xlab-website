import PixelCloud from './PixelCloud'

export default function Sky() {
  return (
    <group>
      <color attach="background" args={['#bfe8ff']} />
      <hemisphereLight args={['#ffffff', '#83a56f', 2.8]} />
      <directionalLight position={[5, 8, 5]} intensity={2.6} castShadow />
      <PixelCloud position={[-5.5, 5.2, -4.2]} />
      <PixelCloud position={[4.2, 5.8, -2.2]} />
      <PixelCloud position={[1.5, 6.4, 5.2]} />
    </group>
  )
}
