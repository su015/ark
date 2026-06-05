import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import LiquidImage from "@/components/LiquidImage";

/**
 * Fullscreen case study modal using GSAP FLIP to animate the project card
 * thumbnail into a full-bleed hero image, then reveal layered case study
 * content. Closing reverses the FLIP back to the originating card.
 */
export default function CaseStudyModal({ project, originRect, onClose }) {
  const overlayRef = useRef(null);
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!project || !originRect) return;
    const hero = heroRef.current;
    const content = contentRef.current;
    if (!hero) return;

    // FLIP-style entrance: start at origin rect, animate to fullscreen.
    const finalRect = hero.getBoundingClientRect();
    const dx = originRect.left - finalRect.left;
    const dy = originRect.top - finalRect.top;
    const sx = originRect.width / finalRect.width;
    const sy = originRect.height / finalRect.height;

    gsap.set(hero, {
      transformOrigin: "top left",
      x: dx, y: dy, scaleX: sx, scaleY: sy,
      opacity: 1,
    });
    gsap.to(hero, {
      x: 0, y: 0, scaleX: 1, scaleY: 1,
      duration: 0.9,
      ease: "expo.inOut",
    });
    gsap.fromTo(
      content?.querySelectorAll(".cs-stagger") || [],
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: "power3.out", delay: 0.45 }
    );

    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [project, originRect]);

  const close = () => {
    const hero = heroRef.current;
    const content = contentRef.current;
    if (!hero || !originRect) { onClose(); return; }
    setClosing(true);
    const finalRect = hero.getBoundingClientRect();
    const dx = originRect.left - finalRect.left;
    const dy = originRect.top - finalRect.top;
    const sx = originRect.width / finalRect.width;
    const sy = originRect.height / finalRect.height;

    gsap.to(content?.querySelectorAll(".cs-stagger") || [], {
      y: 30, opacity: 0, duration: 0.3, stagger: 0.03, ease: "power2.in",
    });
    gsap.to(hero, {
      x: dx, y: dy, scaleX: sx, scaleY: sy,
      duration: 0.75,
      ease: "expo.inOut",
      onComplete: onClose,
    });
  };

  if (!project) return null;

  return (
    <div
      ref={overlayRef}
      className="case-modal"
      data-testid="case-study-modal"
    >
      <div className="absolute inset-0 overflow-y-auto" data-lenis-prevent>
        {/* Fullscreen hero */}
        <div
          ref={heroRef}
          className="relative w-full h-[100vh] overflow-hidden"
          style={{ background: project.accent_color }}
        >
          <LiquidImage src={project.image_url} alt={project.title} accentColor={project.accent_color} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg)] pointer-events-none" />

          <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 md:p-10 z-10 pointer-events-none">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg)]">
              / case study · {project.year}
            </span>
            <button
              onClick={close}
              className="btn-pill pointer-events-auto"
              disabled={closing}
              data-cursor-label="CLOSE"
              data-testid="case-study-close"
            >
              Close ✕
            </button>
          </header>

          <div className="absolute bottom-12 left-0 right-0 px-6 md:px-10 z-10 pointer-events-none">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg)] mb-3">{project.category}</div>
            <h1 className="font-display text-[10vw] md:text-[8vw] leading-[0.92] text-[var(--fg)]">{project.title}</h1>
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--fg)] mt-3">{project.client}</div>
          </div>
        </div>

        {/* Case study content */}
        <div ref={contentRef} className="max-w-[1400px] mx-auto px-6 md:px-10 py-32 space-y-32">
          <section className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-3 cs-stagger">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Brief ]</div>
              <div className="font-mono text-xs uppercase tracking-widest text-[var(--fg-dim)]">{project.client}</div>
            </div>
            <div className="md:col-span-9 cs-stagger">
              <p className="font-display text-3xl md:text-5xl leading-[1.05] text-[var(--fg)]">
                {project.description}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-3 cs-stagger">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Services ]</div>
            </div>
            <div className="md:col-span-9 flex flex-wrap gap-2 cs-stagger">
              {(project.services || []).map((s) => (
                <span key={s} className="font-mono text-xs uppercase tracking-widest border border-[var(--line)] text-[var(--fg)] px-3 py-2 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </section>

          <section className="cs-stagger">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl">
              <LiquidImage src={project.image_url} alt={`${project.title} still`} accentColor={project.accent_color} />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 cs-stagger">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Approach ]</div>
              <p className="text-[var(--fg)] text-base md:text-lg leading-snug">
                We rebuilt the system from the ground up — strategy first, then identity, then a kinetic interface that mutates as the user inputs change. Every component carries motion as a first-class property, not an afterthought.
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Outcome ]</div>
              <p className="text-[var(--fg)] text-base md:text-lg leading-snug">
                Launched in 11 days. Earned media in 4 international design outlets. The client extended the engagement into a 2-year retainer.
              </p>
            </div>
          </section>

          <section className="cs-stagger text-center pb-20">
            <button onClick={close} className="btn-solid">Back to all work →</button>
          </section>
        </div>
      </div>
    </div>
  );
}
