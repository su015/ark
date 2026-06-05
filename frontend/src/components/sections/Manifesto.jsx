import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TextRoll from "@/components/TextRoll";
import FadeUp from "@/components/ui/FadeUp";

gsap.registerPlugin(ScrollTrigger);

const STATEMENTS = [
  "WE REJECT NORMAL.",
  "INTERACTION IS IDENTITY.",
  "STATIC IS DEAD.",
  "WE BUILD DIGITAL EMOTION.",
];

/**
 * Manifesto section.
 * Original physics have been removed as requested. Statements are now static 
 * but still retain the spotlight cursor effect.
 */
export default function Manifesto() {
  const sectionRef = useRef(null);

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      className="relative w-full bg-[var(--bg)] py-20 md:py-32 overflow-hidden border-t border-[var(--line)]"
      data-testid="manifesto"
    >
      <div className="absolute top-10 left-6 md:left-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] z-10">
        / 02 &mdash; Manifesto · spotlight reveals secrets
      </div>
      <div className="absolute top-10 right-6 md:right-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] hidden md:block z-10">
        engineered, not assembled.
      </div>

      <div className="relative w-full mt-12 flex flex-col items-center justify-center gap-6 md:gap-10" style={{ minHeight: "40vh" }}>
        {STATEMENTS.map((text, i) => {
          const colors = ["var(--accent)", "var(--accent-2)", "var(--accent-3)", "var(--fg)"];
          const color = colors[i % colors.length];
          // Slight asymmetry in horizontal placement
          const translateX = i % 2 === 0 ? "-20px" : "20px";

          return (
            <div
              key={i}
              className="manifesto-spotlight relative"
              data-cursor="spot"
              data-cursor-label="REVEAL"
              style={{ transform: `translateX(${translateX})` }}
            >
              {/* Base statement */}
              <div
                className="cursor-pointer"
                style={{
                  fontFamily: "'Archivo Black', sans-serif",
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                  color: color,
                  fontSize: "clamp(30px, 6vw, 100px)",
                  lineHeight: "0.9",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  zIndex: 1,
                  position: "relative"
                }}
              >
                <TextRoll center>{text}</TextRoll>
              </div>

              {/* Hidden neon layer revealed by spotlight cursor */}
              <div
                className="neon-layer absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-none"
                style={{
                  fontFamily: "'Archivo Black', sans-serif",
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                  fontSize: "clamp(30px, 6vw, 100px)",
                  lineHeight: "0.9",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  zIndex: 2,
                }}
              >
                <TextRoll center>{text}</TextRoll>
              </div>
            </div>
          );
        })}
      </div>

      <FadeUp stagger={0.2} className="max-w-[1600px] mx-auto px-6 md:px-10 mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Ethos ]</div>
          <p className="text-[var(--fg)] text-base md:text-lg leading-snug">
            Beauty without friction is decoration. We design systems that <em>respond</em>, <em>flex</em>, and <em>misbehave</em> just enough to be remembered.
          </p>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Method ]</div>
          <p className="text-[var(--fg)] text-base md:text-lg leading-snug">
            Strategy, art direction, code, motion &mdash; one team, one tempo. No handoffs, no compromises.
          </p>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Outcome ]</div>
          <p className="text-[var(--fg)] text-base md:text-lg leading-snug">
            Brands that feel like operating systems. Sites people return to like favourite songs.
          </p>
        </div>
      </FadeUp>
    </section>
  );
}
