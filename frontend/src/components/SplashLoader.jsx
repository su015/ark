import { useEffect, useState } from "react";
import gsap from "gsap";

export default function SplashLoader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => setTimeout(() => setDone(true), 250),
    });
    tl.fromTo(
      ".splash-count",
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );
    tl.to(
      ".splash-progress",
      { width: "100%", duration: 1.6, ease: "power2.inOut" },
      "<"
    );
    tl.to(".splash-letters span", {
      y: -100,
      opacity: 0,
      stagger: 0.04,
      duration: 0.6,
      ease: "power3.in",
    });
    tl.to(".splash-overlay", { y: "-100%", duration: 0.8, ease: "power3.inOut" });
    return () => tl.kill();
  }, []);

  if (done) return null;

  const letters = "ARKETYPE.".split("");

  return (
    <div className="splash-overlay fixed inset-0 z-[100] bg-[var(--bg)] flex flex-col items-center justify-center">
      <div className="splash-letters flex">
        {letters.map((l, i) => (
          <span
            key={i}
            className="font-display text-6xl sm:text-8xl md:text-9xl text-[var(--fg)] inline-block"
            style={{ display: "inline-block" }}
          >
            {l}
          </span>
        ))}
      </div>
      <div className="splash-count mt-12 w-72 md:w-96">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-[var(--fg-dim)] mb-3">
          <span>booting digital sandbox</span>
          <span>2026</span>
        </div>
        <div className="h-[2px] bg-white/10 overflow-hidden">
          <div className="splash-progress h-full w-0 bg-[var(--fg)]" />
        </div>
      </div>
    </div>
  );
}
