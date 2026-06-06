export type MovementInput = {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

export function getIsoMovement(input: MovementInput) {
  let screenX = 0
  let screenY = 0

  if (input.left) screenX -= 1
  if (input.right) screenX += 1
  if (input.up) screenY -= 1
  if (input.down) screenY += 1

  if (screenX === 0 && screenY === 0) {
    return { x: 0, z: 0 }
  }

  const x = screenX + screenY
  const z = screenY - screenX
  const length = Math.hypot(x, z) || 1

  return {
    x: x / length,
    z: z / length,
  }
}
