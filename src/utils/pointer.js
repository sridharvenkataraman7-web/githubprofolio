// src/utils/pointer.js

/**
 * Convert client (mouse) coordinates into normalized device coordinates (-1 to +1)
 * for use with THREE.Raycaster.
 *
 * clientX, clientY → raw browser pointer positions
 * dom → renderer.domElement
 *
 * Returns:
 *   { x, y }   →   normalized device coords
 */
export function clientToNormalized(clientX, clientY, dom) {
  const rect = dom.getBoundingClientRect()

  const x = ((clientX - rect.left) / rect.width) * 2 - 1
  const y = -((clientY - rect.top) / rect.height) * 2 + 1

  return { x, y }
}

/**
 * Utility: Set pointer vector directly from mouse event.
 * 
 * Example usage:
 *   const pointer = new THREE.Vector2()
 *   updatePointerFromEvent(e, pointer, renderer.domElement)
 */
export function updatePointerFromEvent(e, pointer, dom) {
  const rect = dom.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
}
