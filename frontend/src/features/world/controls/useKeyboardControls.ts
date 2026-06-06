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

export function useKeyboardControls(onAction?: () => void, onEscape?: () => void) {
  const keys = useRef<Record<ControlKey, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
  })

  useEffect(() => {
    const setKey = (event: KeyboardEvent, pressed: boolean) => {
      const mapped = keyMap[event.code as keyof typeof keyMap]
      if (mapped) {
        keys.current[mapped] = pressed
        event.preventDefault()
      }

      if (pressed && event.code === 'KeyE') {
        onAction?.()
      }

      if (pressed && event.code === 'Escape') {
        onEscape?.()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => setKey(event, true)
    const handleKeyUp = (event: KeyboardEvent) => setKey(event, false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onAction, onEscape])

  return keys
}
