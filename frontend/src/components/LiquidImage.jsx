import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * LiquidImage — Three.js powered image with cursor-reactive liquid distortion.
 * Falls back gracefully (renders a plain <img>) if WebGL is unavailable.
 *
 * Effect: UV coordinates are warped by layered sine waves whose phase is
 * driven by the cursor position. Ripple amplitude rises on hover and decays
 * smoothly. Chromatic aberration adds a glossy, cinematic feel.
 */
export default function LiquidImage({ src, alt, accentColor = "#ff3d00", className = "", style = {} }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const stateRef = useRef({
    mouse: new THREE.Vector2(0.5, 0.5),
    target: new THREE.Vector2(0.5, 0.5),
    hover: 0,
    targetHover: 0,
    time: 0,
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Touch / no-webgl fallback: keep the <img> tag.
    let gl;
    try {
      const test = document.createElement("canvas");
      gl = test.getContext("webgl") || test.getContext("experimental-webgl");
    } catch {
      gl = null;
    }
    if (!gl) return;

    let width = wrap.clientWidth;
    let height = wrap.clientHeight;
    if (!width || !height) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.zIndex = "1";
    wrap.appendChild(renderer.domElement);

    // Hide the underlying <img> tag once GL canvas is in place
    if (imgRef.current) imgRef.current.style.opacity = "0";

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const uniforms = {
      uTexture: { value: null },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uImageRes: { value: new THREE.Vector2(1, 1) },
      uAccent: { value: new THREE.Color(accentColor) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uHover;
        uniform vec2 uResolution;
        uniform vec2 uImageRes;
        uniform vec3 uAccent;

        // Cover behaviour like CSS object-fit: cover
        vec2 coverUv(vec2 uv, vec2 res, vec2 imgRes) {
          float screenAspect = res.x / res.y;
          float imageAspect = imgRes.x / imgRes.y;
          vec2 scale = vec2(1.0);
          if (screenAspect > imageAspect) {
            scale = vec2(1.0, imageAspect / screenAspect);
          } else {
            scale = vec2(screenAspect / imageAspect, 1.0);
          }
          return (uv - 0.5) * scale + 0.5;
        }

        // Simple 2D value noise
        float rand(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = rand(i);
          float b = rand(i + vec2(1.0, 0.0));
          float c = rand(i + vec2(0.0, 1.0));
          float d = rand(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          vec2 uv = coverUv(vUv, uResolution, uImageRes);

          // Distance from cursor in pixel-corrected space
          vec2 m = uMouse;
          vec2 d = uv - m;
          float dist = length(d);

          // Falloff ring centered on cursor — strong near cursor, fades out
          float ring = smoothstep(0.6, 0.0, dist);
          float ripple = sin(dist * 30.0 - uTime * 3.0) * 0.5 + 0.5;

          float n = noise(uv * 6.0 + uTime * 0.25);
          float strength = uHover * (0.04 * ring + 0.02 * ripple * ring + 0.015 * n);

          vec2 displacement = normalize(d + vec2(0.0001)) * strength;

          // Chromatic split for glossy edge
          float chroma = uHover * 0.012 * ring;
          vec2 dr = displacement + vec2(chroma, 0.0);
          vec2 dg = displacement;
          vec2 db = displacement - vec2(chroma, 0.0);

          float r = texture2D(uTexture, uv + dr).r;
          float g = texture2D(uTexture, uv + dg).g;
          float b = texture2D(uTexture, uv + db).b;
          vec4 color = vec4(r, g, b, 1.0);

          // Grayscale base with subtle contrast bump
          float gray = dot(color.rgb, vec3(0.3, 0.59, 0.11));
          vec3 base = mix(color.rgb, vec3(gray), 0.6);
          base = (base - 0.5) * 1.05 + 0.5;

          // Accent wash near cursor on hover
          vec3 finalColor = mix(base, uAccent, uHover * ring * 0.35);

          // Subtle vignette
          float v = smoothstep(1.1, 0.4, length(vUv - 0.5));
          finalColor *= mix(0.85, 1.0, v);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let texture;
    loader.load(
      src,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        texture = tex;
        uniforms.uTexture.value = tex;
        if (tex.image) {
          uniforms.uImageRes.value.set(tex.image.width || 1, tex.image.height || 1);
        }
      },
      undefined,
      () => {
        // image load failed; restore the <img> fallback
        if (imgRef.current) imgRef.current.style.opacity = "1";
        renderer.domElement.remove();
      }
    );

    // Mouse tracking
    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      stateRef.current.target.set(x, y);
    };
    const onEnter = () => { stateRef.current.targetHover = 1; };
    const onLeave = () => { stateRef.current.targetHover = 0; };
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);

    const onResize = () => {
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    let raf;
    const clock = new THREE.Clock();
    const tick = () => {
      const dt = clock.getDelta();
      const s = stateRef.current;
      s.mouse.lerp(s.target, Math.min(1, dt * 8));
      s.hover += (s.targetHover - s.hover) * Math.min(1, dt * 6);
      s.time += dt;
      uniforms.uMouse.value.copy(s.mouse);
      uniforms.uHover.value = s.hover;
      uniforms.uTime.value = s.time;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      if (texture) texture.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src, accentColor]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
    >
      {/* Native img kept as fallback before GL initializes / for SR/SEO */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ filter: "grayscale(60%) contrast(1.05)" }}
        loading="lazy"
        crossOrigin="anonymous"
      />
    </div>
  );
}
