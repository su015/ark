import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Floating "LET'S WORK" CTA with:
 * - Magnetic attraction (cursor pulls the button toward itself)
 * - Smiley face morph on hover
 * - Chaotic color cycling on sustained hover
 * - Particle burst when entering hover state
 * - Elastic deformation on release (elastic.out(1, 0.3))
 */
export default function FloatingCTA({ onClick }) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  const burstRef = useRef(null);
  const [morph, setMorph] = useState(false);
  const colorIdx = useRef(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    const burst = burstRef.current;
    if (!wrap || !inner) return;

    let bounds;
    let colorTimer;
    const colors = ["#FF3D00", "#00E5FF", "#B6FF3D", "#FF00C8", "#FFD400"];

    const triggerBurst = () => {
      if (!burst) return;
      const ctx = burst.getContext("2d");
      const r = burst.getBoundingClientRect();
      burst.width = r.width * 2;
      burst.height = r.height * 2;
      ctx.scale(2, 2);
      const cx = r.width / 2;
      const cy = r.height / 2;
      const particles = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const v = 60 + Math.random() * 80;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          age: 0, life: 0.5 + Math.random() * 0.4,
          c: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        ctx.clearRect(0, 0, r.width, r.height);
        let alive = false;
        for (const p of particles) {
          p.age += dt;
          if (p.age >= p.life) continue;
          alive = true;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.96;
          p.vy *= 0.96;
          const a = 1 - p.age / p.life;
          ctx.fillStyle = p.c;
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 * a + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (alive) requestAnimationFrame(tick);
        else ctx.clearRect(0, 0, r.width, r.height);
      };
      requestAnimationFrame(tick);
    };

    const onEnter = () => {
      bounds = wrap.getBoundingClientRect();
      setMorph(true);
      triggerBurst();
      // Chaotic color cycling
      colorTimer = setInterval(() => {
        if (!inner) return;
        colorIdx.current = (colorIdx.current + 1) % colors.length;
        inner.style.background = colors[colorIdx.current];
        inner.style.boxShadow = `0 0 70px ${colors[colorIdx.current]}99`;
      }, 220);
    };
    const onLeave = () => {
      gsap.to(inner, {
        x: 0, y: 0, scaleX: 1, scaleY: 1,
        duration: 0.9,
        ease: "elastic.out(1, 0.3)",
      });
      if (colorTimer) clearInterval(colorTimer);
      inner.style.background = "";
      inner.style.boxShadow = "";
      setMorph(false);
    };
    const onMove = (e) => {
      if (!bounds) bounds = wrap.getBoundingClientRect();
      const x = e.clientX - (bounds.left + bounds.width / 2);
      const y = e.clientY - (bounds.top + bounds.height / 2);
      const dist = Math.sqrt(x * x + y * y);
      // Elastic deformation — stretch in direction of cursor
      const stretch = 1 + Math.min(0.35, dist / 400);
      gsap.to(inner, {
        x: x * 0.4,
        y: y * 0.4,
        scaleX: stretch,
        scaleY: 1 / stretch,
        duration: 0.5,
        ease: "power3.out",
      });
    };

    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);
    wrap.addEventListener("mousemove", onMove);
    return () => {
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      wrap.removeEventListener("mousemove", onMove);
      if (colorTimer) clearInterval(colorTimer);
    };
  }, []);

  return (
    <button
      ref={wrapRef}
      onClick={onClick}
      data-cursor-label="POKE"
      data-magnetic
      className="fixed bottom-6 right-6 z-[60] w-28 h-28 md:w-32 md:h-32 flex items-center justify-center"
      style={{ background: "transparent" }}
      aria-label="Let's work"
      data-testid="floating-cta"
    >
      <canvas
        ref={burstRef}
        className="absolute pointer-events-none"
        style={{
          width: 220, height: 220,
          left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        ref={innerRef}
        className={`rounded-full w-full h-full flex items-center justify-center transition-colors duration-300 ${morph ? "" : "bg-[var(--fg)]"}`}
        style={{
          boxShadow: morph ? "0 0 60px rgba(255,61,0,0.5)" : "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        {morph ? (
          <div className="relative w-12 h-12">
            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-[var(--bg)]" />
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[var(--bg)]" />
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-3 border-2 border-[var(--bg)] border-t-0"
              style={{ borderRadius: "0 0 24px 24px" }}
            />
          </div>
        ) : (
          <div className="text-center font-display text-[var(--bg)] text-[11px] leading-[1.05]">
            LET'S<br />WORK
          </div>
        )}
      </div>
    </button>
  );
}
