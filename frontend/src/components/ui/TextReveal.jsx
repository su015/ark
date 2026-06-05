import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function TextReveal({ children, delay = 0, duration = 1, className = "" }) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !innerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        innerRef.current,
        { y: "110%" },
        {
          y: "0%",
          duration: duration,
          delay: delay,
          ease: "power4.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [delay, duration]);

  // The outer div hides the overflow, the inner div translates up
  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div ref={innerRef} className="will-change-transform inline-block w-full">
        {children}
      </div>
    </div>
  );
}
