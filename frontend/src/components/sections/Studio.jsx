import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealText } from "@/components/ui/reveal-text";
import FadeUp from "@/components/ui/FadeUp";

gsap.registerPlugin(ScrollTrigger);

const TEAM = [
  { name: "MILA AOKI", role: "Founder / Creative Director", note: "Ex-Pentagram. Builds brands like operating systems.", accent: "#FF3D00", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop" },
  { name: "JONAS REI", role: "Head of Interaction", note: "WebGL & physics. Talks to letters until they cooperate.", accent: "#00E5FF", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop" },
  { name: "SAOIRSE BLAKE", role: "Art Director", note: "Editorial obsessive. Once shot a campaign on a glacier.", accent: "#B6FF3D", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop" },
  { name: "DEV ARORA", role: "Engineering Lead", note: "Shaders, sound, scroll. Refuses static layouts.", accent: "#FF00C8", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop" },
  { name: "NORA YIN", role: "Strategy Director", note: "Decodes briefs into uncomfortably useful truths.", accent: "#FFD400", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop" },
  { name: "REIS DELACROIX", role: "Motion Designer", note: "Frame-by-frame addict. Pets the kerning.", accent: "#FF6A00", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop" },
];

function AnimatedCounter({ value }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!ref.current) return;
    const endValue = parseInt(value, 10);
    const obj = { val: 0 };
    
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: endValue,
        duration: 2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
        },
        onUpdate: () => {
          if (ref.current) {
            ref.current.innerText = Math.floor(obj.val);
          }
        }
      });
    }, ref);
    return () => ctx.revert();
  }, [value]);

  return <span ref={ref}>0</span>;
}

export default function Studio() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // We use a ref for quickTo functions so they persist across renders
  const xTo = useRef(null);
  const yTo = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".studio-row",
        { yPercent: 80, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Initialize GSAP quickTo for performant mouse tracking
    if (imageRef.current) {
      xTo.current = gsap.quickTo(imageRef.current, "x", { duration: 0.5, ease: "power3" });
      yTo.current = gsap.quickTo(imageRef.current, "y", { duration: 0.5, ease: "power3" });
    }
  }, []);

  const handleMouseMove = (e) => {
    if (xTo.current && yTo.current) {
      // Offset by half width (75px) and height (100px) to center the image on the cursor
      xTo.current(e.clientX - 75);
      yTo.current(e.clientY - 100);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="studio"
      className="relative w-full bg-[var(--bg)] py-32 md:py-40 border-t border-[var(--line)] overflow-hidden"
      data-testid="studio-section"
    >
      {/* Floating Image Container */}
      <div 
        ref={imageRef}
        className="pointer-events-none fixed top-0 left-0 w-[160px] z-[100] transition-opacity duration-300 flex flex-col gap-3"
        style={{
          opacity: hoveredIndex !== null ? 1 : 0,
        }}
      >
        <div className="w-full h-[220px] relative overflow-hidden rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[var(--bg-2)]">
          {TEAM.map((p, i) => (
            <img
              key={p.name}
              src={p.image}
              alt={p.name}
              className="absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
              style={{
                opacity: hoveredIndex === i ? 1 : 0,
                transform: hoveredIndex === i ? 'scale(1)' : 'scale(1.1)',
                transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
              }}
            />
          ))}
        </div>
        
        {/* Floating text details */}
        <div className="flex flex-col relative h-[40px] text-center">
          {TEAM.map((p, i) => (
            <div 
              key={`${p.name}-text`}
              className="absolute top-0 left-0 w-full transition-opacity duration-500 ease-in-out"
              style={{ opacity: hoveredIndex === i ? 1 : 0 }}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--fg)]" style={{ color: p.accent }}>{p.name}</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-[var(--fg-dim)] mt-1">{p.role}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-10 left-6 md:left-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">
        / 06 &mdash; The Studio
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-12 gap-10 items-end mb-20">
          <div className="col-span-12 md:col-span-7">
            <h2 className="font-display leading-[0.9]">
              <RevealText 
                text="A SMALL"
                textColor="text-[var(--fg)]"
                overlayColor="text-[var(--accent-3)]"
                fontSize="text-[12vw] md:text-[7vw]"
              />
              <br />
              <RevealText 
                text="LOUD ROOM."
                textColor="text-[var(--fg)]"
                overlayColor="text-[var(--accent-3)]"
                fontSize="text-[12vw] md:text-[7vw]"
              />
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5">
            <FadeUp delay={0.2}>
              <p className="text-[var(--fg)] text-base md:text-lg leading-snug">
                Twelve people. Two studios. One stubborn refusal to make forgettable things. We over-index on craft, talk back to briefs, and prototype before pitching.
              </p>
            </FadeUp>
            <FadeUp stagger={0.15} className="grid grid-cols-3 gap-4 mt-8">
              {[
                { n: "12", l: "Humans" },
                { n: "47", l: "Shipped Works" },
                { n: "11", l: "Industries" },
              ].map((m) => (
                <div key={m.l} className="border-t border-[var(--line)] pt-3">
                  <div className="font-display text-3xl md:text-4xl text-[var(--fg)]">
                    <AnimatedCounter value={m.n} />
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--fg-dim)] mt-1">{m.l}</div>
                </div>
              ))}
            </FadeUp>
          </div>
        </div>

        <div 
          className="border-t border-[var(--line)] relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {TEAM.map((p, i) => (
            <div
              key={p.name}
              className="studio-row group border-b border-[var(--line)] py-6 md:py-8 px-2 md:px-4 grid grid-cols-12 gap-4 items-center transition-colors duration-500 hover:bg-[var(--bg-2)] relative z-10"
              data-cursor-label="MEET"
              data-testid={`team-row-${i}`}
              onMouseEnter={() => setHoveredIndex(i)}
            >
              <div className="col-span-2 md:col-span-1 font-mono text-xs text-[var(--fg-dim)]">{String(i + 1).padStart(2, "0")}</div>
              <div className="col-span-10 md:col-span-5">
                <h3
                  className="font-display text-2xl md:text-4xl leading-none transition-all duration-500 group-hover:translate-x-3 inline-block relative"
                  style={{ 
                    color: hoveredIndex === i ? p.accent : "var(--fg)",
                    transition: "color 0.4s ease, transform 0.5s ease" 
                  }}
                >
                  {p.name}
                  <span 
                    className="hover-line absolute left-0 -bottom-2 w-full h-[2px] origin-left scale-x-0 transition-all duration-500 ease-out group-hover:scale-x-100" 
                    style={{ backgroundColor: hoveredIndex === i ? p.accent : "var(--fg)" }}
                  />
                </h3>
              </div>
              <div className="col-span-12 md:col-span-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fg-dim)]">
                {p.role}
              </div>
              <div className="col-span-12 md:col-span-3 text-[var(--fg-dim)] text-sm leading-snug group-hover:text-[var(--fg)] transition-colors duration-500">
                {p.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
