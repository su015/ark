import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FadeUp from "@/components/ui/FadeUp";
import TextReveal from "@/components/ui/TextReveal";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    code: "01",
    title: "Brand Systems",
    blurb: "Identities engineered as living, mutable organisms — built to flex across film, print, product and pixel without losing coherence.",
    capabilities: ["Strategy", "Naming", "Identity", "Voice"],
    image: "/images/brand.png",
  },
  {
    code: "02",
    title: "Art Direction",
    blurb: "Editorial campaigns, lookbooks, launch films and image-making. We craft visual languages that earn attention instead of buying it.",
    capabilities: ["Campaigns", "Photography", "Film", "Editorial"],
    image: "/images/art.png",
  },
  {
    code: "03",
    title: "Experience Design",
    blurb: "Interactive sites, products and spaces. WebGL, physics and motion in service of feelings that people actually remember.",
    capabilities: ["Web", "Product", "Motion", "Spatial"],
    image: "/images/exp.png",
  },
  {
    code: "04",
    title: "Creative Direction",
    blurb: "Embedded leadership for brands building entirely new categories. We sit inside your room, not across the table.",
    capabilities: ["Vision", "Strategy", "Worldbuilding", "Ops"],
    image: "/images/creative.png",
  },
];

export default function Services() {
  const [active, setActive] = useState(null);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // Calculate total horizontal scrolling distance
    // Add extra scroll so the last card centers on screen before pinning releases
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? window.innerWidth * 0.78 : window.innerWidth * 0.40;
    const extraScroll = (window.innerWidth - cardWidth) / 2;
    const totalScroll = track.scrollWidth - window.innerWidth + extraScroll;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: -totalScroll,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalScroll + 200}`, // Add 200px extra scrolling space for smoothness
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="services"
        className="relative w-full bg-[var(--bg)] overflow-hidden border-t border-[var(--line)]"
        style={{ height: "100vh" }}
        data-testid="services"
      >
        <div className="absolute top-10 left-6 md:left-10 z-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">
          / 04 &mdash; Disciplines
        </div>
        <div className="absolute top-10 right-6 md:right-10 z-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] hidden md:block">
          scroll &rarr; horizontal
        </div>

        <div
          ref={trackRef}
          className="absolute inset-0 flex items-center gap-10 md:gap-16 pl-6 md:pl-24 pr-6 md:pr-24 pt-24 will-change-transform"
          style={{ width: "max-content" }}
        >
          {/* Header section in the horizontal scroll track */}
          <div className="flex flex-col items-start justify-center min-w-[40vw] pr-10">
            <TextReveal>
              <h2 className="font-display text-[12vw] md:text-[7vw] leading-[0.9] text-[var(--fg)] uppercase">
                MADE<br />
                <span className="text-[var(--accent)]">FROM</span> CHAOS.
              </h2>
            </TextReveal>
            <FadeUp delay={0.2}>
              <p className="text-[var(--fg)] text-base md:text-lg leading-snug mt-6 max-w-md">
                Four disciplines, no silos. We're a creative agency built like a band &mdash; strategists, art directors, writers, designers, motion artists and engineers, all playing the same set.
              </p>
            </FadeUp>
          </div>

          {/* Service Cards */}
          {SERVICES.map((s, i) => (
            <div
              key={s.code}
              className="group relative shrink-0 w-[78vw] md:w-[40vw] border border-[var(--line)] p-8 md:p-12 transition-colors duration-500 hover:bg-[var(--bg-2)] flex flex-col justify-between overflow-hidden"
              style={{ height: "60vh" }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              data-cursor-label="ZOOM"
              data-testid={`service-row-${i}`}
            >
              {/* Background image fade-in */}
              <div 
                className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 opacity-0 group-hover:opacity-80 scale-105 group-hover:scale-100"
                style={{ backgroundImage: `url(${s.image})` }}
              />

              <div className="relative z-10">
                <div className="font-mono text-xs text-[var(--fg-dim)] mb-6">{s.code}</div>
                <h3 className="font-display text-4xl md:text-5xl text-[var(--fg)] leading-none transition-transform duration-500 group-hover:translate-x-3 mb-6 uppercase inline-block relative group/title cursor-pointer">
                  <span className="transition-colors duration-500 group-hover/title:text-[var(--accent)]">{s.title}</span>
                  <span className="absolute left-0 -bottom-2 w-full h-[2px] bg-[var(--accent)] origin-left scale-x-0 transition-transform duration-500 ease-out group-hover/title:scale-x-100" />
                </h3>
                <p className="text-[var(--fg-dim)] group-hover:text-[var(--fg)] transition-colors duration-500 text-base md:text-lg leading-snug">
                  {s.blurb}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-8 relative z-10">
                {s.capabilities.map((c) => (
                  <span key={c} className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-dim)] group-hover:text-[var(--accent)] px-2 py-1 rounded-full border border-transparent group-hover:border-[var(--accent)] transition-colors">
                    {c}
                  </span>
                ))}
              </div>

              {/* Bottom accent line hover effect */}
              <div
                className={`absolute bottom-0 left-0 h-[2px] bg-[var(--accent)] origin-left transition-transform duration-700 w-full ${
                  active === i ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
