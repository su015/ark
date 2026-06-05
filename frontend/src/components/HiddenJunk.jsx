import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Hidden draggable junk scattered around the page. Each piece is draggable
 * and re-anchors with elastic ease when released. Discovering and dragging
 * 3+ pieces secretly unlocks a "JUNK COLLECTOR" badge in localStorage —
 * a quiet reward for explorers.
 */
const JUNK = [
  // Positioned at far corners + lower-scroll regions so they never block
  // hero physics drag area (which fills the center of the first viewport).
  { id: "circle", char: "●", color: "var(--accent)", top: "92vh", left: "2vw" },
  { id: "cross", char: "✕", color: "var(--accent-2)", top: "150vh", right: "3vw" },
  { id: "star", char: "★", color: "var(--accent-3)", top: "230vh", left: "4vw" },
  { id: "diamond", char: "◆", color: "var(--neon-hidden)", top: "320vh", right: "4vw" },
  { id: "triangle", char: "▲", color: "#FFD400", top: "440vh", left: "3vw" },
];

export default function HiddenJunk() {
  const counterRef = useRef(0);

  useEffect(() => {
    counterRef.current = parseInt(localStorage.getItem("arketype_junk") || "0", 10);
  }, []);

  return (
    <>
      {JUNK.map((j) => (
        <JunkPiece key={j.id} {...j} onPicked={() => {
          counterRef.current = Math.min(JUNK.length, counterRef.current + 1);
          localStorage.setItem("arketype_junk", String(counterRef.current));
          if (counterRef.current === 3) {
            try {
              const { toast } = require("sonner");
              toast(`Junk Collector — you found 3 hidden pieces.`, { duration: 3500 });
            } catch { /* noop */ }
          }
        }} />
      ))}
    </>
  );
}

function JunkPiece({ char, color, top, left, right, onPicked }) {
  const ref = useRef(null);
  const picked = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let startX = 0, startY = 0;
    let originX = 0, originY = 0;
    let lastX = 0, lastY = 0;
    let v = { x: 0, y: 0 };
    let inertiaRaf;

    const onDown = (e) => {
      dragging = true;
      const pt = "touches" in e ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      const rect = el.getBoundingClientRect();
      originX = rect.left;
      originY = rect.top;
      lastX = pt.clientX;
      lastY = pt.clientY;
      if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
      if (!picked.current) {
        picked.current = true;
        onPicked && onPicked();
      }
    };
    const onMove = (e) => {
      if (!dragging) return;
      const pt = "touches" in e ? e.touches[0] : e;
      v.x = pt.clientX - lastX;
      v.y = pt.clientY - lastY;
      lastX = pt.clientX;
      lastY = pt.clientY;
      el.style.transform = `translate(${pt.clientX - startX}px, ${pt.clientY - startY}px) rotate(${(pt.clientX - startX) * 0.2}deg)`;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      // Inertia + elastic return
      let dx = parseFloat(el.dataset.dx || "0") + (lastX - startX);
      let dy = parseFloat(el.dataset.dy || "0") + (lastY - startY);
      gsap.to(el, {
        x: 0, y: 0, rotate: 0,
        duration: 1.3,
        ease: "elastic.out(1, 0.3)",
        onStart: () => {
          // remove inline transform so GSAP can take over via x/y
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          gsap.set(el, { x: dx, y: dy });
        },
      });
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [onPicked]);

  return (
    <div
      ref={ref}
      className="junk-piece font-display select-none"
      style={{
        top, left, right,
        color,
        fontSize: 40,
        textShadow: `0 0 20px ${color}`,
        opacity: 0.55,
        zIndex: 40,
      }}
      data-cursor="drag"
      data-cursor-label="DRAG"
      data-testid={`junk-${char}`}
    >
      {char}
    </div>
  );
}
