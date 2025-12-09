// FULL CODE — Lamp Click Opens SKILLS Panel + JBL Click Opens SPOTIFY Panel
// + Final LIGHT SYSTEM + INTRO CAMERA ANIMATION

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getObjectByNameSafe, logSceneGraph } from "../utils/gltfHelpers";

export default function SceneCanvas({
  onOpenPanel,
  onShowTooltip,
  onHideTooltip,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // -----------------------------
    // Renderer
    // -----------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // -----------------------------
    // Scene + Camera
    // -----------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x131418);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.05,
      1000
    );

    // ⭐ BEGINNING CINEMATIC CAMERA POSITION (doorway)
    camera.position.set(0, 1.6, 6);

    // -----------------------------
    // Controls
    // -----------------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.6;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.7;

    // Disable user control until intro finishes
    controls.enabled = false;

    // ======================================================
    // LIGHTING
    // ======================================================
    scene.add(new THREE.AmbientLight(0x202020, 0.1));

    const leftBlue = new THREE.PointLight(0x4d7cff, 2.2, 12);
    leftBlue.position.set(-4, 2, 0);
    scene.add(leftBlue);

    const rightPink = new THREE.PointLight(0xff66cc, 2.0, 12);
    rightPink.position.set(4, 2, 0);
    scene.add(rightPink);

    const deskWarm = new THREE.PointLight(0xffd29b, 1.6, 4);
    deskWarm.position.set(0, 1.1, 0.6);
    deskWarm.castShadow = true;
    scene.add(deskWarm);

    const ceiling = new THREE.SpotLight(
      0xfff2d6,
      1.4,
      20,
      Math.PI / 4,
      0.5,
      1.2
    );
    ceiling.position.set(0, 5, 0);
    ceiling.target.position.set(0, 1, 0);
    ceiling.castShadow = true;
    ceiling.shadow.mapSize.set(2048, 2048);
    scene.add(ceiling);
    scene.add(ceiling.target);

    const rim = new THREE.PointLight(0x88ddff, 1.0, 30);
    rim.position.set(0, 1.3, -2.5);
    scene.add(rim);

    // ======================================================
    // INTERACTIVE TARGETS
    // ======================================================
    const targets = {
      laptop: null,
      lamp: null,
      lampClickable: null,
      stickyBoard: null,
      hollowKnight: null,
      lampLight: null,
      jbl: null,
    };

    // ======================================================
    // Laptop Welcome Texture
    // ======================================================
    const welcomeCanvas = document.createElement("canvas");
    welcomeCanvas.width = 1024;
    welcomeCanvas.height = 640;

    const ctx = welcomeCanvas.getContext("2d");
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, welcomeCanvas.width, welcomeCanvas.height);
    ctx.fillStyle = "white";
    ctx.font = "64px Arial";
    ctx.fillText("Welcome to My Portfolio", 50, 120);
    ctx.font = "32px Arial";
    ctx.fillText("Click objects to explore.", 50, 200);

    const welcomeTexture = new THREE.CanvasTexture(welcomeCanvas);
    welcomeTexture.encoding = THREE.sRGBEncoding;

    // -----------------------------
    // Load GLB
    // -----------------------------
    const loader = new GLTFLoader();
    loader.load("/models/scene.glb", (gltf) => {
      const root = gltf.scene;
      scene.add(root);
      logSceneGraph(root);

      root.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      targets.laptop = getObjectByNameSafe(root, "LaptopScreen");
      targets.lamp = getObjectByNameSafe(root, "Lamp");
      targets.lampClickable = getObjectByNameSafe(root, "LampClickable");
      targets.stickyBoard = getObjectByNameSafe(root, "StickyBoard");
      targets.hollowKnight = getObjectByNameSafe(root, "HollowKnight");
      targets.jbl = getObjectByNameSafe(root, "JBL");

      // Laptop welcome texture
      if (targets.laptop?.material) {
        const m = Array.isArray(targets.laptop.material)
          ? targets.laptop.material[0]
          : targets.laptop.material;
        m.map = welcomeTexture;
        m.needsUpdate = true;
      }

      // -----------------------------
      // Lamp Light
      // -----------------------------
      if (targets.lamp) {
        const pos = new THREE.Vector3();
        targets.lamp.getWorldPosition(pos);

        const lampLight = new THREE.PointLight(0xffe6b8, 0, 5);
        lampLight.castShadow = true;
        scene.add(lampLight);

        lampLight.position.copy(pos);
        lampLight.position.y += 0.15;

        targets.lampLight = lampLight;
      }

      // ======================================================
      // ⭐ CAMERA INTRO TARGET POSITION
      // ======================================================
      if (targets.laptop) {
        const laptopPos = new THREE.Vector3();
        targets.laptop.getWorldPosition(laptopPos);

        // Final sitting position
        const offset = new THREE.Vector3(0, 0.25, 1.35);
        const q = new THREE.Quaternion();
        targets.laptop.getWorldQuaternion(q);
        offset.applyQuaternion(q);

        const finalCamPos = laptopPos.clone().add(offset);

        controls.target.copy(laptopPos);

        // START ANIMATION
        startCameraIntro(finalCamPos);
      }
    });

    // ======================================================
    // ⭐ CAMERA INTRO ANIMATION FUNCTION
    // ======================================================
    function startCameraIntro(finalPos) {
      let time = 0;
      const duration = 3.0;

      const startPos = camera.position.clone();

      function animateIntro() {
        time += 0.016;
        const t = Math.min(time / duration, 1);

        // Ease in-out cubic
        const ease =
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        camera.position.lerpVectors(startPos, finalPos, ease);
        camera.lookAt(controls.target);

        if (t < 1) {
          requestAnimationFrame(animateIntro);
        } else {
          controls.enabled = true; // enable controls
        }
      }

      requestAnimationFrame(animateIntro);
    }

    // ======================================================
    // RAYCASTING + HOVER
    // ======================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function updatePointer(e) {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }

    const hover = {
      lampIntensity: 0,
      lampIntensityTarget: 0,
    };

    function onPointerDown(e) {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      if (!hits.length) return;

      const hit = hits[0].object;

      if (targets.jbl && (hit === targets.jbl || targets.jbl.children.includes(hit))) {
        onOpenPanel?.("spotify");
        return;
      }
      if (targets.lamp && (hit === targets.lamp || targets.lamp.children.includes(hit))) {
        onOpenPanel?.("skills");
        return;
      }
      if (targets.laptop && (hit === targets.laptop || targets.laptop.children.includes(hit))) {
        onOpenPanel?.("about");
        return;
      }
      if (targets.stickyBoard && (hit === targets.stickyBoard || targets.stickyBoard.children.includes(hit))) {
        onOpenPanel?.("projects");
        return;
      }
      if (targets.hollowKnight && (hit === targets.hollowKnight || targets.hollowKnight.children.includes(hit))) {
        onOpenPanel?.("hobbies");
        return;
      }
    }

    function onPointerMove(e) {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(scene.children, true);

      hover.lampIntensityTarget = 0;
      if (hits.length) {
        const hit = hits[0].object;
        if (
          targets.lamp &&
          (hit === targets.lamp || targets.lamp.children.includes(hit))
        ) {
          hover.lampIntensityTarget = 1;
        }
      }
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    // ======================================================
    // MAIN ANIMATION LOOP
    // ======================================================
    const clock = new THREE.Clock();

    function animate() {
      const dt = clock.getDelta();

      hover.lampIntensity +=
        (hover.lampIntensityTarget - hover.lampIntensity) * dt * 6;

      if (targets.lampLight) {
        targets.lampLight.intensity = hover.lampIntensity * 2.2;
      }

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="canvas-container" />;
}