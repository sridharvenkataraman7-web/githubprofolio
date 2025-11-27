// src/utils/gltfHelpers.js

/**
 * Safely get an object by name from a loaded GLB scene.
 * If not found, logs a helpful warning.
 */
export function getObjectByNameSafe(root, name) {
  if (!root) return null

  const found = root.getObjectByName(name)

  if (!found) {
    console.warn(
      `%c[GLTF WARNING]%c Did not find object named "${name}".`,
      'color: #ff4444; font-weight: bold;',
      'color: white;',
    )
    console.warn(
      `➡️  Open your scene in the three.js Editor, select the object, and rename it to "${name}" under the Properties → Name field. Then re-export the GLB.`
    )
  }

  return found || null
}

/**
 * Recursively logs the scene hierarchy for debugging object names.
 * Useful for checking the exact names the GLB contains.
 */
export function logSceneGraph(root, depth = 0) {
  if (!root) return

  const indent = '  '.repeat(depth)
  const name = root.name || '<noname>'
  const type = root.type || '<notype>'

  console.log(`${indent}${name} — ${type}`)

  if (root.children && root.children.length > 0) {
    root.children.forEach(child => logSceneGraph(child, depth + 1))
  }
}
