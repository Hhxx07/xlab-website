import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useWorldStore } from './store/worldStore'

export default function CameraRig() {
  const { camera } = useThree()
  const offset = useMemo(() => new THREE.Vector3(8, 8, 8), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const playerPosition = useWorldStore.getState().playerPosition
    target.set(playerPosition[0], 0.2, playerPosition[2])
    desired.copy(target).add(offset)
    camera.position.lerp(desired, 0.08)
    camera.lookAt(target)
    camera.updateProjectionMatrix()
  })

  return null
}
