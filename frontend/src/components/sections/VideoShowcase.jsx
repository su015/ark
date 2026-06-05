import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOPICS = [
  { 
    title: "LISTEN", 
    desc: "We start by understanding your goals, audience, and the technical constraints of your infrastructure.",
    color: "#FF3D00", // Bright Orange/Red
    images: [
      "https://images.unsplash.com/photo-1590650153855-d9e808231d41?q=80&w=800",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800",
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800"
    ]
  },
  { 
    title: "SKETCH", 
    desc: "Architecting the solution. We design the pipelines, outline the stack, and prototype the workflow.",
    color: "#00E5FF", // Cyan
    images: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800",
      "https://images.unsplash.com/photo-1503437313881-503a91226402?q=80&w=800",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800"
    ]
  },
  { 
    title: "FORGE", 
    desc: "Building the infrastructure. We construct scalable, secure, and robust systems from the ground up.",
    color: "#B6FF3D", // Lime Green
    images: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800"
    ]
  },
  { 
    title: "LAUNCH", 
    desc: "Deploying to production. We manage the rollout, monitor the edge, and ensure zero-downtime delivery.",
    color: "#FF00C8", // Magenta
    images: [
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800"
    ]
  }
];

export default function VideoShowcase() {
  const sectionRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const leftTextRef = useRef(null);
  const rightTextRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoWrapperRef.current;
    const leftText = leftTextRef.current;
    const rightText = rightTextRef.current;
    const topicElements = gsap.utils.toArray('.topic-card', section);

    if (!section || !video || !leftText || !rightText || topicElements.length === 0) return;

    // Create a GSAP timeline that pins the section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top", 
        end: "+=500%",    // Increased pinning time to fit the individual topic animations comfortably
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    // Step 0: Fade out the side text immediately as scrolling starts
    tl.to(
      [leftText, rightText],
      { opacity: 0, y: -20, duration: 0.5, ease: "power2.out" },
      0 
    );

    // Step 1: Scale up the video to fill the screen
    tl.to(
      video, 
      {
        width: "100vw",
        height: "100vh",
        borderRadius: "0px",
        ease: "power2.inOut",
        duration: 1, 
      },
      0 
    );

    // Step 2: Animate each topic appearing one by one
    // Total duration for all topics = 3
    const durationPerItem = 3 / topicElements.length;
    
    topicElements.forEach((el, index) => {
      const cards = el.querySelectorAll('.topic-img');

      // 1. Container fades in
      tl.fromTo(el,
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: durationPerItem * 0.15, ease: "power2.out" }
      );
      
      // 2. Cards pop up and fan out
      tl.fromTo(cards,
        { scale: 0, rotation: 0, xPercent: 0, yPercent: 50, opacity: 0 },
        {
          scale: (i) => i === 1 ? 1.1 : 0.9,
          opacity: 1,
          xPercent: (i) => i === 0 ? -100 : i === 2 ? 100 : 0, // Fan out left and right
          yPercent: (i) => i === 1 ? -10 : 15, // Center slightly higher, sides lower
          rotation: (i) => i === 0 ? -15 : i === 2 ? 15 : 0, // Tilt the side cards
          duration: durationPerItem * 0.25,
          ease: "back.out(1.5)",
          stagger: 0.05
        },
        "<0.05" // Start slightly after the container starts fading in
      );

      // 3. Hold in the center
      tl.to({}, { duration: durationPerItem * 0.3 });

      // 4. Fade & scale out everything
      tl.to(el,
        { opacity: 0, scale: 1.2, y: -50, duration: durationPerItem * 0.3, ease: "power2.in" }
      );
    });

    // Step 3: Make the video smoothly scale back down into a pill shape
    tl.to(video, {
      width: "15vw",
      height: "65vh",
      borderRadius: "9999px",
      opacity: 1, 
      ease: "power2.inOut",
      duration: 1, 
    });

    // Step 3.5: Fade the side text back in
    tl.to(
      [leftText, rightText],
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.in" },
      "-=0.5" 
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full h-screen bg-[var(--bg)] flex items-center justify-center overflow-hidden"
    >
      {/* --- Section Title --- */}
      <div className="absolute top-10 left-6 md:left-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] z-50 pointer-events-none mix-blend-difference">
        / 05 &mdash; Deployment
      </div>

      {/* --- Left Side Text --- */}
      <div 
        ref={leftTextRef}
        className="absolute left-[5vw] md:left-[10vw] flex flex-col justify-center z-20 pointer-events-none"
      >
        <div className="relative mt-12 md:mt-24">
          <span className="absolute -top-16 -left-6 md:-top-28 md:-left-16 font-display text-7xl md:text-[10rem] text-[#00FF41] transform -rotate-12 italic drop-shadow-lg" style={{ fontFamily: "'Permanent Marker', cursive, sans-serif", zIndex: 10 }}>
            LET'S
          </span>
          <h1 className="font-display text-6xl md:text-[7rem] font-bold tracking-tighter text-[var(--fg)] mt-6 uppercase leading-[0.85] relative z-0">
            Deploy<br/>With Us
          </h1>
        </div>
      </div>

      {/* --- Center Video Wrapper --- */}
      <div 
        ref={videoWrapperRef}
        className="relative flex items-center justify-center overflow-hidden z-10"
        style={{
          width: "15vw", 
          height: "65vh", 
          borderRadius: "9999px", 
        }}
      >
        <video 
          src="/deployment-video.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute w-full h-full object-cover"
        />
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      </div>

      {/* --- Right Side Text --- */}
      <div 
        ref={rightTextRef}
        className="absolute right-[5vw] md:right-[15vw] flex flex-col justify-center max-w-[280px] z-20 pointer-events-none text-center items-center"
      >
        <div className="w-16 h-16 text-[#00FF41] mb-6 relative">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M50 10 L80 40 L70 90 L50 70 L30 90 L20 40 Z" fill="currentColor" fillOpacity="0.1" />
            <circle cx="50" cy="45" r="8" fill="currentColor" />
            <path d="M50 90 L40 100 M50 90 L60 100" stroke="#00FF41" strokeWidth="3" />
            <path d="M20 40 L10 50 M80 40 L90 50" stroke="#00FF41" strokeWidth="3" />
          </svg>
        </div>
        <p className="text-[var(--fg)] text-sm md:text-base leading-snug text-center">
          End-to-End Infrastructure. We manage CI/CD pipelines, containerization, and global edge deployments. Taking your digital products from local development to global scale with zero downtime.
        </p>
      </div>

      {/* --- Sequence Topics Overlay --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
        {TOPICS.map((item, i) => (
          <div key={i} className="topic-card absolute flex flex-col items-center text-center max-w-4xl opacity-0">
            {/* The Images Fan */}
            <div className="relative flex items-center justify-center w-full h-32 md:h-56 mb-8 md:mb-12 z-10 pointer-events-none">
              {item.images.map((src, imgIdx) => (
                <div 
                  key={imgIdx} 
                  className="topic-img absolute w-32 h-24 md:w-64 md:h-48 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900"
                  style={{ zIndex: imgIdx === 1 ? 10 : 5 }}
                >
                  <img src={src} alt={`${item.title} ${imgIdx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {/* The Colored Text */}
            <h1 
              className="font-display text-[15vw] md:text-[10vw] leading-[0.85] uppercase tracking-tighter"
              style={{ color: item.color, textShadow: "0px 10px 30px rgba(0,0,0,0.9)" }}
            >
              {item.title}
            </h1>
            <p 
              className="mt-6 text-xl md:text-3xl text-white font-medium max-w-2xl px-4"
              style={{ textShadow: "0px 4px 15px rgba(0,0,0,0.9)" }}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
