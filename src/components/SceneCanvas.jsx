// FULL CODE — Lamp Click Opens SKILLS Panel + JBL Click Opens SPOTIFY Panel

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
    renderer.physicallyCorrectLights = true
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // -----------------------------
    // Scene + Camera
    // -----------------------------
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x131418)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.05, 1000)
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
    scene.add(new THREE.AmbientLight(0x202020, 0.6))

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.50)
    hemi.position.set(0, 20, 0)
    scene.add(hemi)

    const dir = new THREE.DirectionalLight(0xffffff, 0.3)
    dir.position.set(5, 10, 8)
    dir.castShadow = true
    dir.shadow.mapSize.set(2048, 2048)
    scene.add(dir)

    const ceilingSpot = new THREE.SpotLight(0xfff2d6, 1.0, 20, Math.PI / 6, 0.6, 1.5)
    ceilingSpot.position.set(0, 6, 0)
    ceilingSpot.target.position.set(0, 0.75, 0)
    ceilingSpot.castShadow = true
    scene.add(ceilingSpot)
    scene.add(ceilingSpot.target)

    const deskFill = new THREE.PointLight(0xffe6b3, 0.6, 6)
    deskFill.position.set(0.5, 1.2, 0.5)
    deskFill.castShadow = true
    scene.add(deskFill)

    const rim = new THREE.PointLight(0x88ccff, 0.15, 10)
    rim.position.set(-3, 2, -3)
    scene.add(rim)

    // -----------------------------
    // Interactive Targets
    // -----------------------------
    const targets = {
      laptop: null,
      lamp: null,
      lampClickable: null,
      stickyBoard: null,
      hollowKnight: null,
      lampLight: null,
      jbl: null,          // ⭐ NEW — JBL Speaker
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
    // Load GLB
    // -----------------------------
    const loader = new GLTFLoader()
    loader.load('/models/scene.glb', gltf => {
      const root = gltf.scene
      scene.add(root)
      logSceneGraph(root)

      root.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true
          obj.receiveShadow = true
        }
      })

      // Assign scene objects
      targets.laptop = getObjectByNameSafe(root, 'LaptopScreen')
      targets.lamp = getObjectByNameSafe(root, 'Lamp')
      targets.lampClickable = getObjectByNameSafe(root, 'LampClickable')
      targets.stickyBoard = getObjectByNameSafe(root, 'StickyBoard')
      targets.hollowKnight = getObjectByNameSafe(root, 'HollowKnight')
      targets.jbl = getObjectByNameSafe(root, 'JBL')  // ⭐ JBL SPEAKER

      // Laptop screen texture
      if (targets.laptop?.material) {
        const m = Array.isArray(targets.laptop.material)
          ? targets.laptop.material[0]
          : targets.laptop.material
        m.map = welcomeTexture
        m.needsUpdate = true
      }

      // Lamp Light
      if (targets.lamp) {
        const lampLight = new THREE.PointLight(0xffe6b3, 0, 8)
        lampLight.position.set(12, 7, 6)
        lampLight.castShadow = true
        targets.lamp.add(lampLight)
        targets.lampLight = lampLight
      }
    })

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
    // Hover State
    // -----------------------------
    const hoverState = {
      lampGlow: 1,
      lampGlowTarget: 0,
      lampScale: 1,
      lampScaleTarget: 1,
      lampLightIntensity: 0,
      lampLightIntensityTarget: 0,
      laptopGlow: 0,
      laptopGlowTarget: 0,
      laptopScale: 1,
      laptopScaleTarget: 1,
      stickyGlow: 0,
      stickyGlowTarget: 0,
      hollowHover: false
    }

    // -----------------------------
    // CLICK HANDLER (PointerDown)
    // -----------------------------
    function onPointerDown(e) {
      updatePointer(e)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(scene.children, true)
      if (hits.length === 0) return
      const hit = hits[0].object

      // ⭐⭐⭐ JBL → SPOTIFY PANEL ⭐⭐⭐
      if (targets.jbl && (hit === targets.jbl || targets.jbl.children.includes(hit))) {
        onOpenPanel && onOpenPanel('spotify')
        return
      }

      // ⭐⭐⭐ LAMP → SKILLS PANEL ⭐⭐⭐
      if (
        (targets.lamp && (hit === targets.lamp || targets.lamp.children.includes(hit))) ||
        (targets.lampClickable && (hit === targets.lampClickable || targets.lampClickable.children.includes(hit)))
      ) {
        onOpenPanel && onOpenPanel('skills')
        return
      }

      // Laptop → about
      if (targets.laptop && (hit === targets.laptop || targets.laptop.children.includes(hit))) {
        onOpenPanel && onOpenPanel('about')
        return
      }

      // StickyBoard → projects
      if (targets.stickyBoard && (hit === targets.stickyBoard || targets.stickyBoard.children.includes(hit))) {
        onOpenPanel && onOpenPanel('projects')
        return
      }

      // HollowKnight → hobbies
      if (targets.hollowKnight && (hit === targets.hollowKnight || targets.hollowKnight.children.includes(hit))) {
        onOpenPanel && onOpenPanel('hobbies')
        return
      }
    }

    // -----------------------------
    // Pointer Move (Hover)
    // -----------------------------
    function onPointerMove(e) {
      updatePointer(e)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(scene.children, true)

      hoverState.lampGlowTarget = 0
      hoverState.lampScaleTarget = 1
      hoverState.lampLightIntensityTarget = 0
      hoverState.laptopGlowTarget = 0
      hoverState.laptopScaleTarget = 1
      hoverState.stickyGlowTarget = 0
      hoverState.hollowHover = false
      onHideTooltip()

      if (hits.length === 0) return
      const hit = hits[0].object

      if (targets.lamp && (hit === targets.lamp || targets.lamp.children.includes(hit))) {
        hoverState.lampGlowTarget = 1
        hoverState.lampScaleTarget = 1.06
        hoverState.lampLightIntensityTarget = 2.2
      }

      if (targets.laptop && (hit === targets.laptop || targets.laptop.children.includes(hit))) {
        hoverState.laptopGlowTarget = 1
        hoverState.laptopScaleTarget = 1.02
      }

      if (targets.stickyBoard && (hit === targets.stickyBoard || targets.stickyBoard.children.includes(hit))) {
        hoverState.stickyGlowTarget = 1
      }

      if (targets.hollowKnight && (hit === targets.hollowKnight || targets.hollowKnight.children.includes(hit))) {
        hoverState.hollowHover = true
        onShowTooltip({
          visible: false,
          x: e.clientX,
          y: e.clientY,
          text: 'Hobbies: Art, Music, Speedruns'
        })
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
      const lerp = (v, t, s) => v + (t - v) * Math.min(1, dt * s)

      hoverState.lampGlow = lerp(hoverState.lampGlow, hoverState.lampGlowTarget, 6)
      hoverState.lampScale = lerp(hoverState.lampScale, hoverState.lampScaleTarget, 6)
      hoverState.lampLightIntensity = lerp(hoverState.lampLightIntensity, hoverState.lampLightIntensityTarget, 6)

      if (targets.lamp?.material) {
        const m = Array.isArray(targets.lamp.material) ? targets.lamp.material[0] : targets.lamp.material
        const emissive = new THREE.Color(0x001100)
          .lerp(new THREE.Color(0xfff0b8), hoverState.lampGlow)
        m.emissive.copy(emissive)
        if (m.emissiveIntensity !== undefined) {
          m.emissiveIntensity = 0.1 + hoverState.lampGlow * 1.6
        }
        targets.lamp.scale.setScalar(hoverState.lampScale)
      }

      if (targets.lampLight) {
        targets.lampLight.intensity = hoverState.lampLightIntensity
      }

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
