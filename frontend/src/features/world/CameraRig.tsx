import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useWorldStore } from './store/worldStore'

export type WorldCameraMode = 'fixed' | 'free' | 'third'

export default function CameraRig({ mode = 'fixed' }: { mode?: WorldCameraMode }) {
  const { camera } = useThree()
  const fixedOffset = useMemo(() => new THREE.Vector3(8, 8, 8), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])
  const direction = useMemo(() => new THREE.Vector3(0, 0, 1), [])
  const back = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const state = useWorldStore.getState()
    const playerPosition = state.playerPosition
    target.set(playerPosition[0], mode === 'third' ? 1.05 : 0.2, playerPosition[2])

    if (mode === 'third') {
      direction.set(state.playerDirection[0], 0, state.playerDirection[2])
      if (direction.lengthSq() < 0.001) direction.set(0, 0, 1)
      direction.normalize()
      back.copy(direction).multiplyScalar(-4.8)
      desired.set(playerPosition[0], 0, playerPosition[2]).add(back)
      desired.y = 2.8
      camera.position.lerp(desired, 0.12)
    } else {
      desired.copy(target).add(fixedOffset)
      camera.position.lerp(desired, 0.08)
    }

    camera.lookAt(target)
    camera.updateProjectionMatrix()
  })

  return null
}
