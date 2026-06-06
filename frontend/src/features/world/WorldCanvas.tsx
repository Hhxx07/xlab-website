import { Canvas } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import type { MutableRefObject } from 'react'
import type { MovementInput } from './utils/isoDirection'
import WorldScene from './WorldScene'

const emptyControls: MutableRefObject<MovementInput> = {
  current: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
}

export default function WorldCanvas({
  controls = emptyControls,
  preview = false,
}: {
  controls?: MutableRefObject<MovementInput>
  preview?: boolean
}) {
  return (
    <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true }}>
      <OrthographicCamera makeDefault position={[8, 8, 8]} zoom={preview ? 38 : 48} near={0.1} far={100} />
      <WorldScene controls={controls} preview={preview} />
    </Canvas>
  )
}
