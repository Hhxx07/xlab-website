import { useEffect, useRef } from 'react'

const keyMap = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
} as const

type ControlKey = (typeof keyMap)[keyof typeof keyMap]

export function useKeyboardControls(
  onAction?: () => void,
  onEscape?: () => void,
  onLongAction?: () => void,
  onActionProgress?: (progress: number) => void,
) {
  const keys = useRef<Record<ControlKey, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
  })
  const actionStartedAt = useRef<number | null>(null)
  const longActionFired = useRef(false)
  const progressTimer = useRef<number | null>(null)

  useEffect(() => {
    const stopActionTimer = (fireShort: boolean) => {
      if (progressTimer.current !== null) {
        window.clearInterval(progressTimer.current)
        progressTimer.current = null
      }
      onActionProgress?.(0)
      actionStartedAt.current = null
      if (fireShort && !longActionFired.current) onAction?.()
      longActionFired.current = false
    }

    const setKey = (event: KeyboardEvent, pressed: boolean) => {
      const mapped = keyMap[event.code as keyof typeof keyMap]
      if (mapped) {
        keys.current[mapped] = pressed
        event.preventDefault()
      }

      if (event.code === 'KeyE') {
        event.preventDefault()
        if (pressed && actionStartedAt.current === null) {
          actionStartedAt.current = performance.now()
          longActionFired.current = false
          progressTimer.current = window.setInterval(() => {
            if (actionStartedAt.current === null) return
            const progress = Math.min((performance.now() - actionStartedAt.current) / 3000, 1)
            onActionProgress?.(progress)
            if (progress >= 1 && !longActionFired.current) {
              longActionFired.current = true
              onLongAction?.()
            }
          }, 50)
        }
        if (!pressed && actionStartedAt.current !== null) {
          stopActionTimer(true)
        }
      }

      if (pressed && event.code === 'Escape') onEscape?.()
    }

    const handleKeyDown = (event: KeyboardEvent) => setKey(event, true)
    const handleKeyUp = (event: KeyboardEvent) => setKey(event, false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      stopActionTimer(false)
    }
  }, [onAction, onActionProgress, onEscape, onLongAction])

  return keys
}
