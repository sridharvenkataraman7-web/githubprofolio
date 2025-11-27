import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getObjectByNameSafe, logSceneGraph } from '../utils/gltfHelpers'

export default function SceneCanvas({ onOpenPanel, onShowTooltip, onHideTooltip }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // -----------------------------
    // Renderer
    // -----------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputEncoding = THREE.sRGBEncoding
    container.appendChild(renderer.domElement)

    // -----------------------------
    // Scene + Camera
    // -----------------------------
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x131418)

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 2.5, 6)

    // -----------------------------
    // Controls
    // -----------------------------
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1, 0)
    controls.enableDamping = true

    // -----------------------------
    // Lights
    // -----------------------------
    scene.add(new THREE.AmbientLight(0x222222))

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7)
    hemi.position.set(0, 20, 0)
    scene.add(hemi)

    const dir = new THREE.DirectionalLight(0xffffff, 0.6)
    dir.position.set(5, 10, 8)
    scene.add(dir)

    // -----------------------------
    // Interactive Object References
    // -----------------------------
    const targets = {
      laptop: null,
      lamp: null,
      lampClickable: null,
      stickyBoard: null,
      hollowKnight: null
    }

    // -----------------------------
    // Laptop Welcome Texture
    // -----------------------------
    const welcomeCanvas = document.createElement('canvas')
    welcomeCanvas.width = 1024
    welcomeCanvas.height = 640
    const ctx = welcomeCanvas.getContext('2d')

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, welcomeCanvas.width, welcomeCanvas.height)

    ctx.fillStyle = 'white'
    ctx.font = '64px Arial'
    ctx.fillText('Welcome to My Portfolio', 50, 120)

    ctx.font = '32px Arial'
    ctx.fillText('Click the objects around the scene to explore.', 50, 200)

    const welcomeTexture = new THREE.CanvasTexture(welcomeCanvas)
    welcomeTexture.encoding = THREE.sRGBEncoding

    // -----------------------------
    // Load GLTF
    // -----------------------------
    const loader = new GLTFLoader()
    loader.load(
      '/models/scene.glb',
      gltf => {
        scene.add(gltf.scene)
        console.log('Loaded Scene:')
        logSceneGraph(gltf.scene)

        // Find named objects
        targets.laptop = getObjectByNameSafe(gltf.scene, 'LaptopScreen')
        targets.lamp = getObjectByNameSafe(gltf.scene, 'Lamp')
        targets.lampClickable = getObjectByNameSafe(gltf.scene, 'LampClickable')
        targets.stickyBoard = getObjectByNameSafe(gltf.scene, 'StickyBoard')
        targets.hollowKnight = getObjectByNameSafe(gltf.scene, 'HollowKnight')

        // Apply welcome screen texture
        if (targets.laptop && targets.laptop.material) {
          const m = Array.isArray(targets.laptop.material)
            ? targets.laptop.material[0]
            : targets.laptop.material
          m.map = welcomeTexture
          m.needsUpdate = true
        }

        // Ensure emissive property for lamp
        if (targets.lamp?.material) {
          const lampMat = Array.isArray(targets.lamp.material)
            ? targets.lamp.material[0]
            : targets.lamp.material

          if (!lampMat.emissive) lampMat.emissive = new THREE.Color(0x000000)
          lampMat.needsUpdate = true
        }
      }
    )

    // -----------------------------
    // Raycaster
    // -----------------------------
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    function updatePointer(e) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    // -----------------------------
    // Hover State (lamp glow)
    // -----------------------------
    const hoverState = {
      lampGlow: 0,
      lampGlowTarget: 0,
      lampScale: 1,
      lampScaleTarget: 1
    }

    // -----------------------------
    // Pointer Move
    // -----------------------------
    function onPointerMove(e) {
      updatePointer(e)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(scene.children, true)

      if (hits.length === 0) {
        hoverState.lampGlowTarget = 0
        hoverState.lampScaleTarget = 1
        onHideTooltip()
        return
      }

      const hit = hits[0].object

      // Lamp hover
      if (targets.lamp && (hit === targets.lamp || targets.lamp.children.includes(hit))) {
        hoverState.lampGlowTarget = 1
        hoverState.lampScaleTarget = 1.05
      } else {
        hoverState.lampGlowTarget = 0
        hoverState.lampScaleTarget = 1
      }

      // HollowKnight tooltip
      if (
        targets.hollowKnight &&
        (hit === targets.hollowKnight || targets.hollowKnight.children.includes(hit))
      ) {
        onShowTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          text: 'Hobbies: Art, Music, Speedruns'
        })
      } else {
        onHideTooltip()
      }
    }

    // -----------------------------
    // Click Interaction
    // -----------------------------
    function onPointerDown(e) {
      updatePointer(e)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      if (hits.length === 0) return

      const hit = hits[0].object

      if (targets.lampClickable && (hit === targets.lampClickable || targets.lampClickable.children.includes(hit))) {
        onOpenPanel('skills')
      }
      if (targets.stickyBoard && (hit === targets.stickyBoard || targets.stickyBoard.children.includes(hit))) {
        onOpenPanel('projects')
      }
      if (targets.hollowKnight && (hit === targets.hollowKnight || targets.hollowKnight.children.includes(hit))) {
        onOpenPanel('hobbies')
      }
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    // -----------------------------
    // Animation Loop
    // -----------------------------
    const clock = new THREE.Clock()
    let raf

    function animate() {
      const dt = clock.getDelta()

      // Glow Lerp
      hoverState.lampGlow += (hoverState.lampGlowTarget - hoverState.lampGlow) * dt * 6
      hoverState.lampScale += (hoverState.lampScaleTarget - hoverState.lampScale) * dt * 6

      if (targets.lamp?.material) {
        const mat = Array.isArray(targets.lamp.material)
          ? targets.lamp.material[0]
          : targets.lamp.material

        const base = new THREE.Color(0x000000)
        const glow = new THREE.Color(0xffd37a)

        mat.emissive.copy(base.lerp(glow, hoverState.lampGlow))
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.5 + hoverState.lampGlow * 1.5
        }

        targets.lamp.scale.setScalar(hoverState.lampScale)
      }

      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    // -----------------------------
    // Resize
    // -----------------------------
    function onResize() {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // -----------------------------
    // Cleanup
    // -----------------------------
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      controls.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onHideTooltip, onOpenPanel, onShowTooltip])

  return <div ref={mountRef} className="canvas-container" />
}
