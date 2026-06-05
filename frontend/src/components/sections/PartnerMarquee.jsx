import { motion } from "framer-motion";

const LOGOS = [
  "AETHER",
  "NOIR/CO",
  "HELIX",
  "KABUTO",
  "VOLT.",
  "FORGE",
  "ECHO LAB",
  "MIRROR",
  "PULSE",
  "CINDER",
];

export default function PartnerMarquee() {
  return (
    <section className="w-full bg-[var(--bg)] py-10 border-t border-b border-[var(--line)] overflow-hidden" data-testid="partner-marquee">
      <div className="flex items-center justify-between px-6 md:px-10 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">/ Trusted by</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] hidden md:block">
          50+ shipped rituals · 4 continents
        </span>
      </div>
      <div className="overflow-hidden flex w-full">
        <motion.div 
          className="flex w-max"
          animate={{ x: [0, "-50%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 30
          }}
        >
          {[...LOGOS, ...LOGOS].map((l, i) => (
            <span
              key={i}
              className="font-display text-4xl md:text-6xl text-[var(--fg-dim)] mx-10 transition-colors duration-300 hover:text-[var(--fg)] shrink-0"
            >
              {l}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
