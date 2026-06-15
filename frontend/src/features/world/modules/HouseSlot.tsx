import { useEffect, useState, type ComponentType } from 'react'
import GLBHouse from './GLBHouse'

type HouseProps = {
  position: [number, number, number]
}

export default function HouseSlot({
  position,
  modelUrl,
  Fallback,
}: {
  position: [number, number, number]
  modelUrl?: string
  Fallback: ComponentType<HouseProps>
}) {
  const [modelAvailable, setModelAvailable] = useState(false)

  useEffect(() => {
    let alive = true
    if (!modelUrl) {
      setModelAvailable(false)
      return () => {
        alive = false
      }
    }

    fetch(modelUrl, { method: 'HEAD' })
      .then((res) => {
        if (alive) setModelAvailable(res.ok)
      })
      .catch(() => {
        if (alive) setModelAvailable(false)
      })

    return () => {
      alive = false
    }
  }, [modelUrl])

  if (modelUrl && modelAvailable) {
    return <GLBHouse url={modelUrl} position={position} />
  }

  return <Fallback position={position} />
}
