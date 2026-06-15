import { Suspense, useEffect, useState, type ComponentType } from 'react'
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
        if (!alive) return
        const contentType = res.headers.get('content-type') ?? ''
        const contentLength = Number(res.headers.get('content-length') ?? '0')
        const looksLikeModel =
          res.ok &&
          !contentType.includes('text/html') &&
          (contentType.includes('model/gltf-binary') ||
            contentType.includes('application/octet-stream') ||
            contentType.includes('application/x-binary') ||
            contentLength > 1024)
        setModelAvailable(looksLikeModel)
      })
      .catch(() => {
        if (alive) setModelAvailable(false)
      })

    return () => {
      alive = false
    }
  }, [modelUrl])

  if (modelUrl && modelAvailable) {
    return (
      <Suspense fallback={<Fallback position={position} />}>
        <GLBHouse url={modelUrl} position={position} />
      </Suspense>
    )
  }

  return <Fallback position={position} />
}
