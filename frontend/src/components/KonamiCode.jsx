import { useEffect, useRef, useState } from "react";

const SEQ = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

/**
 * Konami code easter egg. Triggers a chaos sequence:
 * 1. Color inversion + shake (chaos-mode class)
 * 2. Particle storm overlay (canvas)
 * 3. Letter explosion in hero (custom event, hero applies random impulses)
 * 4. Reformation message after 6s
 */
export default function KonamiCode() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    let idx = 0;
    const onKey = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expected = SEQ[idx].length === 1 ? SEQ[idx].toLowerCase() : SEQ[idx];
      if (key === expected) {
        idx += 1;
        setProgress(idx);
        if (idx === SEQ.length) {
          triggerChaos();
          idx = 0;
        }
      } else {
        idx = 0;
        setProgress(0);
      }
    };

    const triggerChaos = () => {
      setActive(true);
      document.documentElement.classList.add("chaos-mode");
      // Notify hero physics to explode letters
      window.dispatchEvent(new CustomEvent("arketype:chaos", { detail: { kind: "start" } }));

      // Particle storm
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
        canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        const ctx = canvas.getContext("2d");
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        const colors = ["#FF3D00", "#00E5FF", "#B6FF3D", "#FF00C8", "#FFD400", "#F2EFEA"];
        const particles = [];
        for (let i = 0; i < 220; i++) {
          particles.push({
            x: Math.random() * window.innerWidth,
            y: -20 - Math.random() * 400,
            vx: (Math.random() - 0.5) * 80,
            vy: 150 + Math.random() * 300,
            r: 2 + Math.random() * 4,
            c: colors[Math.floor(Math.random() * colors.length)],
            life: 2 + Math.random() * 2,
            age: 0,
          });
        }
        let last = performance.now();
        let stop = false;
        const tick = (now) => {
          if (stop) return;
          const dt = Math.min(0.04, (now - last) / 1000);
          last = now;
          ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
          ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
          for (const p of particles) {
            p.age += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // gravity
            ctx.fillStyle = p.c;
            ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => { stop = true; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }, 6200);
      }

      setTimeout(() => {
        document.documentElement.classList.remove("chaos-mode");
        window.dispatchEvent(new CustomEvent("arketype:chaos", { detail: { kind: "end" } }));
        setActive(false);
        setProgress(0);
      }, 6000);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="chaos-particles" />
      {progress > 0 && progress < SEQ.length && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] glass px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest text-[var(--fg-dim)]" data-testid="konami-progress">
          secret protocol &middot; {progress}/{SEQ.length}
        </div>
      )}
      {active && (
        <div className="fixed inset-0 z-[80] pointer-events-none flex items-center justify-center" data-testid="konami-active">
          <div className="font-display text-7xl md:text-9xl text-[var(--accent)]" style={{ mixBlendMode: "difference" }}>
            CHAOS UNLOCKED
          </div>
        </div>
      )}
    </>
  );
}
