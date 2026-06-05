import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Particle field rendered with vanilla Three.js (no R3F) to avoid the
 * React 19 + @react-three/fiber dev-mode interaction where `__source`
 * props leak into the reconciler and trigger "Cannot set x-line-number".
 */
export default function ParticleField({ density = 1200, color = "#F2EFEA", className = "absolute inset-0", style = {} }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let W = wrap.clientWidth;
    let H = wrap.clientHeight;
    if (!W || !H) return;

    let gl;
    try {
      const test = document.createElement("canvas");
      gl = test.getContext("webgl") || test.getContext("experimental-webgl");
    } catch { gl = null; }
    if (!gl) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(W, H);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 6);

    const count = density;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.018,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const mouse = new THREE.Vector2(0, 0);
    const targetMouse = new THREE.Vector2(0, 0);
    const onMouseMove = (e) => {
      const rect = wrap.getBoundingClientRect();
      targetMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      const dt = clock.getDelta();
      const t = clock.elapsedTime;
      mouse.lerp(targetMouse, Math.min(1, dt * 6));
      const mx = mouse.x * 6;
      const my = mouse.y * 3.5;
      const arr = positions;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        arr[idx] += Math.sin(t * 0.15 + seeds[i]) * 0.0015;
        arr[idx + 1] += Math.cos(t * 0.12 + seeds[i]) * 0.0015;
        const dx = arr[idx] - mx;
        const dy = arr[idx + 1] - my;
        const d2 = dx * dx + dy * dy + 0.01;
        if (d2 < 4) {
          const inv = 1 / Math.sqrt(d2);
          const force = 0.04 / d2;
          arr[idx] += dx * inv * force;
          arr[idx + 1] += dy * inv * force;
        }
        if (arr[idx] > 7) arr[idx] = -7;
        if (arr[idx] < -7) arr[idx] = 7;
        if (arr[idx + 1] > 4.5) arr[idx + 1] = -4.5;
        if (arr[idx + 1] < -4.5) arr[idx + 1] = 4.5;
      }
      geometry.attributes.position.needsUpdate = true;
      points.rotation.z = t * 0.005;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [density, color]);

  return <div ref={wrapRef} className={className} style={{ pointerEvents: "none", ...style }} />;
}
