import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import InteractivePhysicsText from "@/components/InteractivePhysicsText";

gsap.registerPlugin(ScrollTrigger);

export default function HeroPhysics() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    // Scroll-driven fade out for content
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress; 
        if (contentRef.current) {
          contentRef.current.style.opacity = String(1 - p * 1.4);
          contentRef.current.style.transform = `translateY(${p * 60}px)`;
        }
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[var(--bg)]"
      style={{ height: "100vh", minHeight: 640 }}
    >
      {/* Planet Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-[0] pointer-events-none opacity-80 mix-blend-screen"
      >
        <source src="/videos/earth_bg.mp4" type="video/mp4" />
      </video>

      {/* Atmospheric grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] z-[1]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(90deg, var(--fg) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Top header bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-10 py-6 pointer-events-none">
        <div className="font-display text-xl md:text-2xl text-[var(--fg)] pointer-events-auto" data-testid="brand-mark">
          ARK<span className="text-[var(--accent)]">.</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--fg-dim)] pointer-events-auto">
          <a className="ulink hover:text-[var(--fg)]" href="#manifesto" data-cursor-label="JUMP">Manifesto</a>
          <a className="ulink hover:text-[var(--fg)]" href="#work" data-cursor-label="VIEW">Work</a>
          <a className="ulink hover:text-[var(--fg)]" href="#services" data-cursor-label="EXPAND">Disciplines</a>
          <a className="ulink hover:text-[var(--fg)]" href="#studio" data-cursor-label="MEET">Studio</a>
          <a className="ulink hover:text-[var(--fg)]" href="#contact" data-cursor-label="HELLO">Contact</a>
        </nav>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-dim)] hidden md:flex items-center gap-4 pointer-events-auto">
          <span>v.001 / build 2026</span>
        </div>
      </header>

      {/* Framer Motion physics text replacing the static text */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div 
          style={{
            fontFamily: "'Monument Extended', 'Druk Wide', 'Syne', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(40px, 11vw, 180px)",
            color: "#FFFFFF",
            lineHeight: 1,
            letterSpacing: "0.04em"
          }}
        >
          <InteractivePhysicsText 
            text="ARKETYPE" 
            className="pointer-events-auto" 
            containerRef={sectionRef} 
          />
        </div>
      </div>

      {/* Foreground content */}
      <div ref={contentRef} className="absolute inset-0 z-[5] flex flex-col items-center justify-end pb-32 pointer-events-none px-6 md:px-10">
        <div className="w-full flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="max-w-md">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">
              [ An experimental creative agency ]
            </div>
            <p className="text-[var(--fg)] text-base md:text-lg leading-snug font-light">
              Brand systems. Art direction. Films. Spaces. Code.<br />
              We engineer <span className="italic text-[var(--accent-2)]">creative experiences</span> that outlive their own moment.
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">scroll &darr;</span>
      </div>
    </section>
  );
}
