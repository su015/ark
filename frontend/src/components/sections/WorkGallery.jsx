"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import InfiniteMenu from "@/components/ui/InfiniteMenu";

const galleryItems = [
  {
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
    link: '#',
    title: 'Retro Wave',
    description: 'Nostalgic digital aesthetic blending the past and the future.'
  },
  {
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    link: '#',
    title: 'Neon Drift',
    description: 'High contrast environments designed for pure visual impact.'
  },
  {
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    link: '#',
    title: 'Cyber Circuit',
    description: 'Intricate digital pathways defining modern architecture.'
  },
  {
    image: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=1200&auto=format&fit=crop',
    link: '#',
    title: 'Data Flow',
    description: 'Visualizing the invisible motion of information.'
  }
];

export default function Gallery() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current || !textRef.current || !canvasRef.current) return;

    gsap.fromTo(
      textRef.current.children,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      }
    );

    gsap.fromTo(
      canvasRef.current,
      { opacity: 0, scale: 0.95 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
        },
      }
    );
  }, []);

  return (
    <section id="work" ref={sectionRef} className="relative w-full h-[100vh] flex flex-col pt-32 pb-10 overflow-hidden bg-[var(--bg)]">
      <div className="absolute top-10 left-6 md:left-10 z-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">
        / 03 &mdash; Selected work · drag to explore
      </div>
      <div ref={textRef} className="text-center mb-8 px-6 max-w-[1400px] mx-auto w-full shrink-0">
        <h2 
          className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-normal leading-[0.9] text-[var(--fg)] mb-4 uppercase"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          INTERACTIVE GALLERY
        </h2>
        <p 
          className="text-[var(--fg-dim)] max-w-[700px] mx-auto font-light leading-[1.6] text-[16px] md:text-[18px]"
        >
          Drag around to <span className="text-[var(--accent)]">explore</span> our 3D <span className="text-[var(--accent)]">visual archive</span>.
        </p>
      </div>

      <div ref={canvasRef} className="relative w-full flex-grow overflow-hidden max-w-[1400px] mx-auto rounded-3xl border border-[var(--line)] bg-[var(--bg-2)] backdrop-blur-sm">
        {/* Subtle gradient overlays to blend the 3D canvas with the background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--bg)] to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none hidden md:block" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none hidden md:block" />
        
        <InfiniteMenu items={galleryItems} scale={1.0} />
      </div>
    </section>
  );
}
