import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Magnetic cursor with:
 * - Trailing dot + ring (GSAP with elastic snap on hover targets)
 * - Magnetic snap to [data-magnetic] elements (cursor pulled to element center)
 * - Particle trail canvas (mix-blend difference)
 * - Spotlight mode (large mask) when over [data-cursor="spot"]
 * - Contextual labels via [data-cursor-label]
 */
export default function MagneticCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);
  const trailRef = useRef(null);
  const stateRef = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    tx: window.innerWidth / 2,
    ty: window.innerHeight / 2,
    rx: window.innerWidth / 2,
    ry: window.innerHeight / 2,
    snapTarget: null,
    particles: [],
  });

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const state = stateRef.current;
    const trail = trailRef.current;
    const tctx = trail?.getContext("2d");
    const resizeTrail = () => {
      if (!trail) return;
      trail.width = window.innerWidth * (window.devicePixelRatio || 1);
      trail.height = window.innerHeight * (window.devicePixelRatio || 1);
      trail.style.width = `${window.innerWidth}px`;
      trail.style.height = `${window.innerHeight}px`;
      if (tctx) tctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resizeTrail();
    window.addEventListener("resize", resizeTrail);

    const onMove = (e) => {
      state.tx = e.clientX;
      state.ty = e.clientY;

      // Snap target (magnetic) — pull toward element center with elastic feel
      if (state.snapTarget) {
        const r = state.snapTarget.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        state.tx = cx + (e.clientX - cx) * 0.45;
        state.ty = cy + (e.clientY - cy) * 0.45;
      }

      if (labelRef.current) {
        gsap.to(labelRef.current, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power3.out" });
      }

      // Particle trail disabled
    };

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;

      // Smooth ease toward target
      state.x += (state.tx - state.x) * Math.min(1, dt * 22);
      state.y += (state.ty - state.y) * Math.min(1, dt * 22);
      state.rx += (state.tx - state.rx) * Math.min(1, dt * 12);
      state.ry += (state.ty - state.ry) * Math.min(1, dt * 12);

      if (dotRef.current) dotRef.current.style.transform = `translate(${state.x}px, ${state.y}px)`;
      if (ringRef.current) {
        // If snap target, stretch ring toward cursor
        if (state.snapTarget) {
          const r = state.snapTarget.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = state.tx - cx;
          const dy = state.ty - cy;
          const angle = Math.atan2(dy, dx);
          const stretch = Math.min(1.6, 1 + Math.sqrt(dx * dx + dy * dy) / 220);
          ringRef.current.style.transform = `translate(${state.rx}px, ${state.ry}px) rotate(${angle}rad) scale(${stretch}, ${1 / Math.max(stretch, 1)})`;
        } else {
          ringRef.current.style.transform = `translate(${state.rx}px, ${state.ry}px)`;
        }
      }

      // Particle trail rendering
      if (tctx && trail) {
        const fg = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#F2EFEA";
        // Convert hex to rgb once per frame
        let rgb = "242, 239, 234";
        if (fg.startsWith("#") && fg.length === 7) {
          const r = parseInt(fg.slice(1, 3), 16);
          const g = parseInt(fg.slice(3, 5), 16);
          const b = parseInt(fg.slice(5, 7), 16);
          rgb = `${r}, ${g}, ${b}`;
        }
        tctx.clearRect(0, 0, trail.width, trail.height);
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.age += dt;
          if (p.age >= p.life) { state.particles.splice(i, 1); continue; }
          const t = p.age / p.life;
          const alpha = (1 - t) * 0.5;
          const r = (1 - t) * 6;
          tctx.beginPath();
          tctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          tctx.fillStyle = `rgba(${rgb}, ${alpha})`;
          tctx.fill();
        }
      }

      // CSS variable for spotlight mask used by manifesto
      document.documentElement.style.setProperty("--mx", `${state.x}px`);
      document.documentElement.style.setProperty("--my", `${state.y}px`);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const setHover = (mode, label) => {
      if (!ringRef.current) return;
      ringRef.current.classList.remove("hover-link", "hover-drag", "hover-spot");
      if (mode) ringRef.current.classList.add(mode);
      if (labelRef.current) {
        labelRef.current.textContent = label || "";
        labelRef.current.classList.toggle("show", !!label);
      }
    };

    const handleOver = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const magnetic = t.closest("[data-magnetic]");
      state.snapTarget = magnetic || null;

      if (t.closest("[data-cursor='spot']")) {
        const labelEl = t.closest("[data-cursor-label]");
        setHover("hover-spot", labelEl?.getAttribute("data-cursor-label") || "");
      } else if (t.closest("[data-cursor='drag']")) {
        setHover("hover-drag", "DRAG");
      } else if (t.closest("a, button, [data-cursor='link'], input, textarea, select, [data-magnetic]")) {
        const labelEl = t.closest("[data-cursor-label]");
        setHover("hover-link", labelEl?.getAttribute("data-cursor-label") || "");
      } else {
        setHover(null, "");
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", handleOver);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", handleOver);
      window.removeEventListener("resize", resizeTrail);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
      <div ref={labelRef} className="cursor-label" />
    </>
  );
}
