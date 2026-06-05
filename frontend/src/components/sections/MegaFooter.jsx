import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { formatApiError } from "@/context/AuthContext";
import { toast } from "sonner";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FadeUp from "@/components/ui/FadeUp";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

export default function MegaFooter() {
  const [form, setForm] = useState({ name: "", email: "", company: "", budget: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newsletter, setNewsletter] = useState("");
  const headlineRef = useRef(null);
  const columnsRef = useRef(null);
  const footerRef = useRef(null);
  const [isExploded, setIsExploded] = useState(false);

  const onSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/contact", form);
      setSubmitted(true);
      setForm({ name: "", email: "", company: "", budget: "", message: "" });
      toast.success("Transmission received. We'll reply within 48h.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not send.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletter) return;
    try {
      await api.post("/newsletter", { email: newsletter });
      toast.success("Subscribed. Welcome to the signal.");
      setNewsletter("");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not subscribe.");
    }
  };

  const handleMouseMove = (e) => {
    // Eye tracking logic (active always)
    const eye = document.querySelector(".eye-container");
    const pupil = document.querySelector(".pupil-dot");
    if (eye && pupil) {
      const rect = eye.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;
      
      const dx = e.clientX - eyeCenterX;
      const dy = e.clientY - eyeCenterY;
      const angle = Math.atan2(dy, dx);
      
      // Elliptical boundary for the pupil to match the eye shape
      const maxDistX = rect.width * 0.25; 
      const maxDistY = rect.height * 0.15;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      const moveFactor = Math.min(1, distance / 500); // Normalize mouse distance
      
      const pupilX = Math.cos(angle) * maxDistX * moveFactor;
      const pupilY = Math.sin(angle) * maxDistY * moveFactor;
      
      gsap.to(pupil, {
        x: pupilX,
        y: pupilY,
        duration: 0.2,
        ease: "power2.out"
      });
    }

    // Explosion hover logic
    if (isExploded) return;
    const h = headlineRef.current;
    if (!h) return;
    const letters = h.querySelectorAll(".mega-letter");
    letters.forEach((letter) => {
      const lr = letter.getBoundingClientRect();
      const lx = lr.left + lr.width / 2;
      const ly = lr.top + lr.height / 2;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.max(0, 1 - dist / 400);
      letter.style.fontWeight = String(400 + proximity * 500);
      letter.style.fontStretch = `${100 + proximity * 50}%`;
      letter.style.transform = `translateY(${proximity * -6}px) scaleY(${1 + proximity * 0.06})`;
    });
  };

  useEffect(() => {
    const headlineEl = headlineRef.current;
    const columnsEl = columnsRef.current;
    const footerEl = footerRef.current;
    if (!headlineEl || !columnsEl || !footerEl) return;

    const letters = headlineEl.querySelectorAll(".mega-letter");

    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(columnsEl, { opacity: 0, scale: 0.95 });
      gsap.set([".contact-title", ".contact-title-sub"], { opacity: 0, y: 50, skewY: 2 });
      gsap.set(".contact-field", { opacity: 0, y: 50, skewY: 2 });
      gsap.set(".side-info-item", { opacity: 0, y: 30 });

      // Create timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerEl,
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            setIsExploded(self.progress > 0.05);
          }
        }
      });

      // Explosion vector setup
      const numLetters = letters.length;
      const centerIndex = numLetters / 2;

      letters.forEach((letter, i) => {
        const dirX = (i - centerIndex) / centerIndex;
        
        // Random direction vectors pushing outward from center
        const targetX = dirX * 600 + (Math.random() - 0.5) * 400;
        const targetY = (Math.random() - 0.5) * 500 - 150;
        const targetZ = (Math.random() - 0.5) * 600;
        
        const rotX = (Math.random() - 0.5) * 720;
        const rotY = (Math.random() - 0.5) * 720;
        const rotZ = (Math.random() - 0.5) * 360;
        const scale = 0.3 + Math.random() * 0.9;

        tl.to(letter, {
          x: targetX,
          y: targetY,
          z: targetZ,
          rotationX: rotX,
          rotationY: rotY,
          rotationZ: rotZ,
          scale: scale,
          opacity: 0,
          ease: "power2.out"
        }, 0);
      });

      // Emerge form
      tl.to(columnsEl, {
        opacity: 1,
        scale: 1,
        pointerEvents: "auto",
        duration: 0.5,
        ease: "power2.out"
      }, 0.2);

      // Animate titles
      tl.to([".contact-title", ".contact-title-sub"], {
        opacity: 1,
        y: 0,
        skewY: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out"
      }, 0.3);

      // Stagger contact fields
      tl.to(".contact-field", {
        opacity: 1,
        y: 0,
        skewY: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out"
      }, 0.45);

      // Stagger side info items
      tl.to(".side-info-item", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out"
      }, 0.5);

    }, footerEl);

    return () => ctx.revert();
  }, []);

  // Blinking animation for the 'O'
  useEffect(() => {
    let blinkTimeout;
    const blink = () => {
      const eye = document.querySelector(".eye-container");
      if (eye) {
        gsap.to(eye, {
          scaleY: 0.1,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
          onComplete: () => {
            blinkTimeout = setTimeout(blink, Math.random() * 4000 + 2000);
          }
        });
      } else {
        blinkTimeout = setTimeout(blink, 1000);
      }
    };
    blinkTimeout = setTimeout(blink, 2000);
    return () => {
      clearTimeout(blinkTimeout);
      gsap.killTweensOf(".eye-container");
    };
  }, []);

  const headline = "LET'S BREAK THE INTERNET.";

  return (
    <footer
      ref={footerRef}
      id="contact"
      className="relative w-full bg-[var(--bg)] border-t border-[var(--line)] overflow-hidden"
      data-testid="mega-footer"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute top-10 left-6 md:left-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">
        / 07 &mdash; Contact
      </div>

      <div className="px-6 md:px-10 pt-32 md:pt-48 pb-12 max-w-[1800px] mx-auto">
        <div className="contact-interactive-container min-h-[60vh] md:min-h-[70vh]">
          {/* Mega headline */}
          <div
            ref={headlineRef}
            className="headline-container grid-area-overlap cursor-default select-none w-full"
          >
            <h2 className="font-display text-[14vw] md:text-[12vw] leading-[0.88] tracking-[-0.04em] text-[var(--fg)] text-center">
              {headline.split("").map((ch, i) => (
                <span
                  key={i}
                  className="mega-letter inline-block"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </h2>
          </div>

          {/* Two columns */}
          <div
            ref={columnsRef}
            className="columns-container grid-area-overlap w-full opacity-0 pointer-events-none"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Contact form */}
              <div className="lg:col-span-7">
                <h1 className="contact-title font-display text-6xl md:text-[7rem] font-bold leading-[0.85] tracking-tighter uppercase text-[var(--fg)] mb-12">
                  C<span className="eye-container relative inline-block align-middle w-[0.85em] h-[0.85em] mx-[0.05em] -translate-y-[0.05em]">
                    <svg viewBox="0 0 100 100" className="absolute w-full h-full fill-[var(--fg)]">
                      <path d="M 0 50 Q 50 -50 100 50 Q 50 150 0 50 Z" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="pupil-dot relative w-[40%] h-[40%] bg-[var(--bg)] rounded-full flex items-center justify-center overflow-hidden">
                        <div className="w-[45%] h-[45%] bg-[var(--accent)] rounded-full shadow-[0_0_15px_var(--accent)]" />
                      </div>
                    </div>
                  </span>NTACT<br/>US
                </h1>
                <div className="contact-title-sub font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-6">
                  [ Brief us ]
                </div>
                {submitted ? (
                  <div className="border border-[var(--line)] p-10 rounded-2xl text-center" data-testid="contact-success">
                    <div className="font-display text-5xl md:text-6xl text-[var(--accent)] mb-4">RECEIVED.</div>
                    <p className="text-[var(--fg-dim)] mb-6">We'll respond within 48 hours. Until then &mdash; keep breaking things.</p>
                    <button onClick={() => setSubmitted(false)} className="btn-pill" data-testid="contact-send-another">
                      Send another &rarr;
                    </button>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="space-y-0 border-t border-[var(--line)]" data-testid="contact-form">
                    {[
                      { name: "name", label: "YOUR NAME", required: true },
                      { name: "email", label: "YOUR EMAIL", type: "email", required: true },
                      { name: "company", label: "COMPANY (OPTIONAL)" },
                      { name: "budget", label: "BUDGET (USD) — OPTIONAL" },
                    ].map((f) => (
                      <div key={f.name} className="contact-field relative group border-b border-[var(--line)] py-4 md:py-5 grid grid-cols-12 items-baseline gap-4 overflow-hidden">
                        <label className="col-span-12 md:col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] group-focus-within:text-[var(--accent)] transition-colors duration-300">
                          {f.label}{f.required && <span className="text-[var(--accent)]">*</span>}
                        </label>
                        <input
                          type={f.type || "text"}
                          required={f.required}
                          value={form[f.name]}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                          className="col-span-12 md:col-span-9 w-full bg-transparent text-xl md:text-2xl text-[var(--fg)] font-light focus:text-[var(--accent)] transition-colors outline-none"
                          placeholder={f.name === "budget" ? "e.g. 25k — 75k" : ""}
                          data-testid={`contact-input-${f.name}`}
                        />
                        {/* Focus line animation */}
                        <div className="absolute bottom-0 left-0 h-[1px] bg-[var(--accent)] w-0 group-focus-within:w-full transition-all duration-500 ease-out"></div>
                      </div>
                    ))}
                    <div className="contact-field relative group border-b border-[var(--line)] py-4 md:py-5 grid grid-cols-12 items-baseline gap-4 overflow-hidden">
                      <label className="col-span-12 md:col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] group-focus-within:text-[var(--accent)] transition-colors duration-300">
                        THE BRIEF<span className="text-[var(--accent)]">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="col-span-12 md:col-span-9 w-full bg-transparent text-xl md:text-2xl text-[var(--fg)] font-light focus:text-[var(--accent)] transition-colors resize-none outline-none"
                        placeholder="Tell us what you're trying to break."
                        data-testid="contact-input-message"
                      />
                      {/* Focus line animation */}
                      <div className="absolute bottom-0 left-0 h-[1px] bg-[var(--accent)] w-0 group-focus-within:w-full transition-all duration-500 ease-out"></div>
                    </div>
                    <div className="contact-field pt-8 flex items-center justify-end">
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="btn-pill"
                      >
                        {submitting ? "SENDING..." : "SUBMIT BRIEF"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Side info */}
              <div className="lg:col-span-5 space-y-12">
                <div className="side-info-item">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Reach us ]</div>
                  <a href="mailto:hello@arketype.studio" className="font-display text-3xl md:text-4xl text-[var(--fg)] hover:text-[var(--accent)] transition-colors" data-cursor-label="MAIL" data-testid="footer-email">
                    hello@arketype.studio
                  </a>
                  <div className="text-[var(--fg-dim)] mt-3 text-sm leading-relaxed">
                    Studio · Brooklyn / Berlin<br />
                    Mon — Fri · 09:00 → 22:00 CET
                  </div>
                </div>

                <div className="side-info-item">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Channels ]</div>
                  <div className="flex flex-col gap-2 text-lg">
                    {[
                      { l: "Instagram", h: "#" },
                      { l: "X / Twitter", h: "#" },
                      { l: "LinkedIn", h: "#" },
                      { l: "Are.na", h: "#" },
                    ].map((s) => (
                      <a key={s.l} href={s.h} className="group text-[var(--fg)] hover:text-[var(--accent)] transition-colors flex items-center w-fit overflow-hidden" data-cursor-label="OPEN">
                        <span className="group-hover:translate-x-2 transition-transform duration-300">{s.l}</span>
                        <span className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-300">↗</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="side-info-item">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-3">[ Newsletter ]</div>
                  <form onSubmit={onSubscribe} className="relative group flex items-center gap-2 border-b border-[var(--line)] pb-3 overflow-hidden" data-testid="newsletter-form">
                    <input
                      type="email"
                      value={newsletter}
                      onChange={(e) => setNewsletter(e.target.value)}
                      placeholder="your@inbox.com"
                      className="flex-1 text-base text-[var(--fg)] bg-transparent outline-none"
                      required
                      data-testid="newsletter-input"
                    />
                    <button type="submit" className="font-mono text-xs uppercase tracking-widest text-[var(--fg-dim)] group-focus-within:text-[var(--accent)] hover:text-[var(--accent)] transition-colors" data-testid="newsletter-submit">
                      Subscribe →
                    </button>
                    {/* Focus line animation */}
                    <div className="absolute bottom-0 left-0 h-[1px] bg-[var(--accent)] w-0 group-focus-within:w-full transition-all duration-500 ease-out"></div>
                  </form>
                  <div className="text-[var(--fg-dim)] text-xs mt-2">Field notes, not spam. One transmission per month.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee tail */}
        <div className="mt-32 flex overflow-hidden border-t border-b border-[var(--line)] py-6 w-full">
          <motion.div 
            className="flex w-max font-display text-5xl md:text-7xl text-[var(--fg)]"
            animate={{ x: ["-50%", 0] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 25
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="mx-8 whitespace-nowrap shrink-0">
                MAKE SOMETHING UNFORGETTABLE.&nbsp;<span className="text-[var(--accent)]">★</span>&nbsp;
              </span>
            ))}
          </motion.div>
        </div>

        {/* Colophon */}
        <FadeUp delay={0.3} className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">
          <div>© 2026 ARKETYPE Studio. All friction reserved.</div>
          <div className="flex items-center gap-6">
            <span>Built with physics, scroll & spite.</span>
            <span className="text-[var(--accent-3)]">try the konami code ↑↑↓↓←→←→ba</span>
          </div>
          <a href="/admin/login" className="ulink hover:text-[var(--fg)]" data-cursor-label="ADMIN" data-testid="footer-admin-link">
            Admin →
          </a>
        </FadeUp>
      </div>
    </footer>
  );
}

