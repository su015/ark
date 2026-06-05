import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FadeUp({ children, delay = 0, duration = 0.8, y = 40, stagger = 0, className = "" }) {
  const elRef = useRef(null);

  useEffect(() => {
    if (!elRef.current) return;
    
    // Check if children are elements that should stagger
    const target = stagger > 0 ? elRef.current.children : elRef.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        target,
        { y: y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: duration,
          delay: delay,
          stagger: stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: elRef.current,
            start: "top 85%", // Trigger slightly before it comes fully into view
          },
        }
      );
    }, elRef);

    return () => ctx.revert();
  }, [delay, duration, y, stagger]);

  return (
    <div ref={elRef} className={className}>
      {children}
    </div>
  );
}
