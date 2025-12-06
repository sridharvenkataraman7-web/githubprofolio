// src/components/SceneCanvas.jsx
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
    // Lights (scene ambient)
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
      laptop: null,           // LaptopScreen mesh
      lamp: null,             // Lamp mesh/head
      lampClickable: null,    // lamp base clickable
      stickyBoard: null,
      hollowKnight: null,
      lampLight: null         // dynamic point light we attach
    }

    // -----------------------------
    // Laptop Welcome Texture (kept, but optional)
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
    loader.load('/models/scene.glb', gltf => {
      scene.add(gltf.scene)
      console.log('Loaded Scene:')
      logSceneGraph(gltf.scene)

      // find named objects (you confirmed these names)
      targets.laptop = getObjectByNameSafe(gltf.scene, 'LaptopScreen')
      targets.lamp = getObjectByNameSafe(gltf.scene, 'Lamp')
      targets.lampClickable = getObjectByNameSafe(gltf.scene, 'LampClickable')
      targets.stickyBoard = getObjectByNameSafe(gltf.scene, 'StickyBoard')
      targets.hollowKnight = getObjectByNameSafe(gltf.scene, 'HollowKnight')

      // apply welcome texture to laptop screen if present and has material
      if (targets.laptop && targets.laptop.material) {
        const m = Array.isArray(targets.laptop.material)
          ? targets.laptop.material[0]
          : targets.laptop.material
        m.map = welcomeTexture
        m.needsUpdate = true
      }

      // ensure lamp material has emissive
      if (targets.lamp?.material) {
        const lampMat = Array.isArray(targets.lamp.material)
          ? targets.lamp.material[0]
          : targets.lamp.material
        if (!lampMat.emissive) lampMat.emissive = new THREE.Color(0x000000)
        lampMat.needsUpdate = true
      }

      // ensure other interactives have emissive so we can highlight
      const ensureEmissive = obj => {
        if (!obj) return
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material
        if (mat && mat.emissive === undefined) {
          mat.emissive = new THREE.Color(0x000000)
          mat.needsUpdate = true
        }
      }
      ensureEmissive(targets.laptop)
      ensureEmissive(targets.lampClickable)
      ensureEmissive(targets.stickyBoard)
      ensureEmissive(targets.hollowKnight)

      // -------------------------------------
      // Create a point light attached to the lamp (starts at intensity 0)
      // -------------------------------------
      if (targets.lamp) {
        const lampLight = new THREE.PointLight(0xffe6b3, 0, 8) // warm, distance 8
        // The lamp model origin may differ; offset upward a bit
        lampLight.position.set(0, 0.25, 0) // tweak if the bulb is elsewhere
        targets.lamp.add(lampLight)
        targets.lampLight = lampLight

        // optional: small bulb helper (comment out in production)
        // const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({color:0xfff5d0}));
        // bulb.position.copy(lampLight.position);
        // targets.lamp.add(bulb);
      }
    })

    // -----------------------------
    // Raycaster & pointer
    // -----------------------------
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    function updatePointer(e) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    // -----------------------------
    // Hover State (centralized)
    // -----------------------------
    const hoverState = {
      // lamp
      lampGlow: 1,
      lampGlowTarget: 0,
      lampScale: 1,
      lampScaleTarget: 1,
      lampLightIntensity: 0,
      lampLightIntensityTarget: 0,
      // laptop
      laptopGlow: 0,
      laptopGlowTarget: 0,
      laptopScale: 1,
      laptopScaleTarget: 1,
      // lampClickable
      lampClickableGlow: 0,
      lampClickableGlowTarget: 0,
      // stickyBoard
      stickyGlow: 0,
      stickyGlowTarget: 0,
      // hollow knight tooltip (on/off)
      hollowHover: false
    }

    // -----------------------------
    // Pointer Move — unified hover detection
    // -----------------------------
    function onPointerMove(e) {
      updatePointer(e)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(scene.children, true)

      // default: clear all targets
      hoverState.lampGlowTarget = 0
      hoverState.lampScaleTarget = 1
      hoverState.lampLightIntensityTarget = 0

      hoverState.laptopGlowTarget = 0
      hoverState.laptopScaleTarget = 1

      hoverState.lampClickableGlowTarget = 0
      hoverState.stickyGlowTarget = 0

      // hide tooltip by default (may re-show below)
      hoverState.hollowHover = false
      onHideTooltip()

      if (hits.length === 0) return

      const hit = hits[0].object

      // Lamp hover: glow + scale + turn on light
      if (targets.lamp && (hit === targets.lamp || targets.lamp.children.includes(hit))) {
        hoverState.lampGlowTarget = 1
        hoverState.lampScaleTarget = 1.06
        hoverState.lampLightIntensityTarget = 2.2
      }

      // Laptop hover: gentle screen glow + slight scale
      if (targets.laptop && (hit === targets.laptop || targets.laptop.children.includes(hit))) {
        hoverState.laptopGlowTarget = 1
        hoverState.laptopScaleTarget = 1.02
      }

      // LampClickable hover: small highlight
      if (
        targets.lampClickable &&
        (hit === targets.lampClickable || targets.lampClickable.children.includes(hit))
      ) {
        hoverState.lampClickableGlowTarget = 1
      }

      // StickyBoard hover: highlight
      if (targets.stickyBoard && (hit === targets.stickyBoard || targets.stickyBoard.children.includes(hit))) {
        hoverState.stickyGlowTarget = 1
      }

      // HollowKnight hover -> show tooltip
      if (
        targets.hollowKnight &&
        (hit === targets.hollowKnight || targets.hollowKnight.children.includes(hit))
      ) {
        hoverState.hollowHover = true
        onShowTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          text: 'Hobbies: Art, Music, Speedruns'
        })
      }
    }

    // -----------------------------
    // Click Interaction — open panels
    // -----------------------------
    function onPointerDown(e) {
      updatePointer(e)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      if (hits.length === 0) return

      const hit = hits[0].object

      // Laptop -> about
      if (targets.laptop && (hit === targets.laptop || targets.laptop.children.includes(hit))) {
        onOpenPanel && onOpenPanel('about')
        return
      }

      // LampClickable -> skills
      if (targets.lampClickable && (hit === targets.lampClickable || targets.lampClickable.children.includes(hit))) {
        onOpenPanel && onOpenPanel('skills')
        return
      }

      // StickyBoard -> projects
      if (targets.stickyBoard && (hit === targets.stickyBoard || targets.stickyBoard.children.includes(hit))) {
        onOpenPanel && onOpenPanel('projects')
        return
      }

      // HollowKnight -> hobbies
      if (targets.hollowKnight && (hit === targets.hollowKnight || targets.hollowKnight.children.includes(hit))) {
        onOpenPanel && onOpenPanel('hobbies')
        return
      }
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    // -----------------------------
    // Animation Loop - apply lerped transitions
    // -----------------------------
    const clock = new THREE.Clock()
    let raf

    function animate() {
      const dt = clock.getDelta()

      // lerp helpers (feel free to adjust speed multipliers)
      const lerp = (val, target, speed) => {
        return val + (target - val) * Math.min(1, dt * speed)
      }

      // lamp lerps
      hoverState.lampGlow = lerp(hoverState.lampGlow, hoverState.lampGlowTarget, 6)
      hoverState.lampScale = lerp(hoverState.lampScale, hoverState.lampScaleTarget, 6)
      hoverState.lampLightIntensity = lerp(hoverState.lampLightIntensity, hoverState.lampLightIntensityTarget, 6)

      // laptop lerps
      hoverState.laptopGlow = lerp(hoverState.laptopGlow, hoverState.laptopGlowTarget, 6)
      hoverState.laptopScale = lerp(hoverState.laptopScale, hoverState.laptopScaleTarget, 6)

      // lampClickable
      hoverState.lampClickableGlow = lerp(hoverState.lampClickableGlow, hoverState.lampClickableGlowTarget, 6)

      // sticky
      hoverState.stickyGlow = lerp(hoverState.stickyGlow, hoverState.stickyGlowTarget, 6)

      // Apply effects on actual objects (if they exist)
      // -- Lamp: emissive color and scale + actual point light intensity
      if (targets.lamp && targets.lamp.material) {
        const mat = Array.isArray(targets.lamp.material) ? targets.lamp.material[0] : targets.lamp.material
        // base and glow colors
        const base = new THREE.Color(0x001100) // dark base
        const glow = new THREE.Color(0xfff0b8) // warm lamp glow
        // compute emissive via lerp
        const emissive = base.clone().lerp(glow, hoverState.lampGlow)
        mat.emissive.copy(emissive)
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.1 + hoverState.lampGlow * 1.6
        }
        // scale
        targets.lamp.scale.setScalar(hoverState.lampScale)
      }

      // update actual light attached to lamp
      if (targets.lampLight) {
        targets.lampLight.intensity = hoverState.lampLightIntensity
        // Optionally, change light color temperature slightly with intensity
        // targets.lampLight.color.setHSL(0.12, 0.9, 0.5 + hoverState.lampLightIntensity*0.05)
      }

      // -- Laptop screen: emissive to simulate glow + small scale
      if (targets.laptop && targets.laptop.material) {
        const mat = Array.isArray(targets.laptop.material) ? targets.laptop.material[0] : targets.laptop.material
        const base = new THREE.Color(0x000000)
        const glow = new THREE.Color(0xffffff)
        const emissive = base.clone().lerp(glow, hoverState.laptopGlow * 0.9)
        if (mat.emissive) {
          mat.emissive.copy(emissive)
        } else {
          mat.emissive = emissive
        }
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.05 + hoverState.laptopGlow * 0.9
        }
        // subtle scale (if desired)
        targets.laptop.scale.setScalar(hoverState.laptopScale)
      }

      // -- LampClickable small highlight
      if (targets.lampClickable && targets.lampClickable.material) {
        const mat = Array.isArray(targets.lampClickable.material) ? targets.lampClickable.material[0] : targets.lampClickable.material
        const base = new THREE.Color(0x000000)
        const glow = new THREE.Color(0x88ff88)
        const emissive = base.clone().lerp(glow, hoverState.lampClickableGlow)
        if (!mat.emissive) mat.emissive = emissive
        else mat.emissive.copy(emissive)
        if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.05 + hoverState.lampClickableGlow * 0.8
      }

      // -- StickyBoard highlight (warm-yellow)
      if (targets.stickyBoard && targets.stickyBoard.material) {
        const mat = Array.isArray(targets.stickyBoard.material) ? targets.stickyBoard.material[0] : targets.stickyBoard.material
        const base = new THREE.Color(0x000000)
        const glow = new THREE.Color(0xffd27a)
        const emissive = base.clone().lerp(glow, hoverState.stickyGlow)
        if (!mat.emissive) mat.emissive = emissive
        else mat.emissive.copy(emissive)
        if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.04 + hoverState.stickyGlow * 0.9
      }

      // -- HollowKnight tooltip handled in pointer event earlier (no visual change here),
      // but we might add a tiny scale on hover:
      if (targets.hollowKnight && targets.hollowKnight.material) {
        const s = hoverState.hollowHover ? 1.03 : 1.0
        // smooth it by lerping current scale toward s
        const currentScale = targets.hollowKnight.scale.x || 1
        const newScale = currentScale + (s - currentScale) * Math.min(1, dt * 6)
        targets.hollowKnight.scale.setScalar(newScale)
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
