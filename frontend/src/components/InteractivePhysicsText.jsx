"use client";

import { motion, useMotionValue, useSpring, animate, useAnimationFrame } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

function DraggableLetter({
  item,
  index,
  items,
  body,
  containerRef,
  isComplete,
  anyDropped,
  onSnapChange,
  onDragStateChange,
  onDrop,
  onHoverChange,
}) {
  const x = body.motionX;
  const y = body.motionY;
  const rotate = body.motionRotate;
  const isCollapsed = body.isDropped;
  const isSnapped = body.isSnapped;

  const letterRef = useRef(null);

  // Initial reveal (runs once before dropped)
  useEffect(() => {
    if (!isCollapsed) {
      animate(y, 0, {
        type: "spring",
        damping: 12,
        stiffness: 100,
        delay: index * 0.05 + 0.5,
      });
    }
  }, [isCollapsed, index, y]);

  const updateSnapped = (newVal) => {
    if (isSnapped !== newVal) {
      onSnapChange(index, newVal);
    }
  };

  const handleDragStart = () => {
    updateSnapped(false);
    onDragStateChange(index, true);
  };

  const handleDragEnd = (e, info) => {
    onDragStateChange(index, false, info?.velocity?.x || 0, info?.velocity?.y || 0);
    if (!letterRef.current) return;

    const currentRect = letterRef.current.getBoundingClientRect();
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const currentCenterY = currentRect.top + currentRect.height / 2;

    let snapped = false;

    // Check all slots that require this letter
    for (let i = 0; i < items.length; i++) {
      if (items[i] === item) {
        const slotEl = document.getElementById(`ghost-slot-${i}`);
        if (slotEl) {
          const slotRect = slotEl.getBoundingClientRect();
          const slotCenterX = slotRect.left + slotRect.width / 2;
          const slotCenterY = slotRect.top + slotRect.height / 2;

          const dist = Math.hypot(slotCenterX - currentCenterX, slotCenterY - currentCenterY);

          // Magnet snap threshold
          if (dist < 60) {
            snapped = true;
            updateSnapped(true);
            const deltaX = slotCenterX - currentCenterX;
            const deltaY = slotCenterY - currentCenterY;

            animate(x, x.get() + deltaX, { type: "spring", stiffness: 300, damping: 20 });
            animate(y, y.get() + deltaY, { type: "spring", stiffness: 300, damping: 20 });
            animate(rotate, 0, { type: "spring", stiffness: 300, damping: 20 });
            break; // Snapped to this slot, stop checking
          }
        }
      }
    }

    if (!snapped) {
      updateSnapped(false);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Ghost Outline (only visible when any dropped) */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: anyDropped ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        id={`ghost-slot-${index}`}
        className="inline-block absolute inset-0"
        onPointerEnter={() => {
          if (isCollapsed && !isSnapped) onHoverChange(`${index}-ghost`, 'ghost');
        }}
        onPointerLeave={() => {
          onHoverChange(`${index}-ghost`, null);
        }}
        style={{
          color: "transparent",
          WebkitTextStroke: "2px rgba(255,255,255,0.15)",
        }}
      >
        {item === " " ? "\u00A0" : item}
      </motion.span>

      {/* Draggable Letter */}
      <motion.span
        ref={letterRef}
        style={{
          x,
          y,
          rotate,
          cursor: isCollapsed && !isSnapped ? "grab" : "default",
          touchAction: isCollapsed && !isSnapped ? "none" : "auto",
          userSelect: "none",
        }}
        drag={isCollapsed}
        dragConstraints={
          containerRef || { top: -1000, left: -1000, right: 1000, bottom: 1000 }
        }
        dragElastic={0.1}
        dragMomentum={false} // Disable throw momentum
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={
          isCollapsed
            ? {
              opacity: 1,
              color: isComplete ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0)",
              WebkitTextStroke: isComplete
                ? "0px rgba(255,255,255,0)"
                : isSnapped
                  ? "2px rgba(0, 194, 255, 1)"
                  : "2px rgba(245,245,245,0.8)",
              filter: isComplete
                ? [
                  "drop-shadow(0px 0px 0px rgba(255,255,255,0))",
                  "drop-shadow(0px 0px 8px rgba(255,255,255,0.4))",
                  "drop-shadow(0px 0px 0px rgba(255,255,255,0))",
                ]
                : isSnapped
                  ? "drop-shadow(0px 0px 0px rgba(0, 194, 255, 0))"
                  : "drop-shadow(0px 0px 0px rgba(255,255,255,0))",
            }
            : {
              opacity: 1,
              color: "rgba(255, 255, 255, 1)",
              WebkitTextStroke: "0px rgba(255,255,255,0)",
              filter: "drop-shadow(0px 0px 0px rgba(255,255,255,0))",
            }
        }
        initial={{ opacity: 0, filter: "blur(10px)" }}
        transition={
          isComplete
            ? {
              filter: {
                duration: 3.0,
                ease: "easeInOut",
                delay: index * 0.15, // Creates a wave from left to right
              },
              default: {
                duration: 2.5,
                ease: "easeInOut",
                delay: index * 0.1 // Soft, slow wave for the color fill and stroke fade
              },
            }
            : {
              default: { duration: 0.3 },
            }
        }
        whileDrag={{
          scale: 1.1,
          zIndex: 100,
          cursor: "grabbing",
          WebkitTextStroke: "2px rgba(0, 194, 255, 1)",
          filter: "drop-shadow(0px 0px 0px rgba(0, 194, 255, 0))",
        }}
        whileHover={
          isCollapsed && !isSnapped
            ? {
              scale: 1.05,
              cursor: "grab",
              WebkitTextStroke: "2px rgba(0, 194, 255, 0.6)",
            }
            : !isCollapsed
              ? {
                scale: 1.05,
                cursor: "pointer",
              }
              : {}
        }
        onPointerDown={() => {
          if (!isCollapsed) onDrop();
        }}
        onHoverStart={() => {
          onHoverChange(`${index}-letter`, isCollapsed && !isSnapped ? 'floating' : 'solid');
        }}
        onHoverEnd={() => {
          onHoverChange(`${index}-letter`, null);
        }}
        className="inline-block relative origin-center"
      >
        {item === " " ? "\u00A0" : item}
      </motion.span>
    </div>
  );
}

export default function InteractivePhysicsText({
  text,
  className,
  containerRef,
}) {
  const items = text.split("");
  const [snappedCount, setSnappedCount] = useState(0);
  const [droppedCount, setDroppedCount] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredItems, setHoveredItems] = useState({});
  
  const isComplete = snappedCount === items.length && droppedCount === items.length;
  const isAnyDropped = droppedCount > 0;
  
  const handleHoverChange = (id, type) => {
    setHoveredItems(prev => {
      const next = { ...prev };
      if (type === null) {
        delete next[id];
      } else {
        next[id] = type;
      }
      return next;
    });
  };

  const isHoveringLetter = Object.values(hoveredItems).includes('floating');

  let currentHoverType = null;
  const values = Object.values(hoveredItems);
  if (values.includes('floating')) currentHoverType = 'floating';
  else if (values.includes('ghost')) currentHoverType = 'ghost';
  else if (values.includes('solid')) currentHoverType = 'solid';

  let tooltipText = "Don't click";
  if (currentHoverType === 'floating') tooltipText = "Drag";
  else if (currentHoverType === 'ghost') tooltipText = "Fuck, fix it";
  else if (currentHoverType === 'solid') tooltipText = "Don't click";
  else {
    tooltipText = droppedCount === items.length ? "Fuck, fix it" : "Don't click";
  }

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(mouseX, smoothOptions);
  const smoothY = useSpring(mouseY, smoothOptions);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isHovering || isHoveringLetter) {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [isHovering, isHoveringLetter, mouseX, mouseY]);

  const layoutOffsetsRef = useRef([]);

  // Initialize physics bodies
  const physicsState = useRef(
    items.map(() => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const x = useMotionValue(0);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const y = useMotionValue(40);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const rotate = useMotionValue(0);

      return {
        x: 0,
        y: 40,
        vx: 0,
        vy: 0,
        width: 80,
        height: 80,
        isDropped: false,
        isDragging: false,
        isSnapped: false,
        hasHitFloor: false,
        targetFloorY: 420, // Will be updated in useEffect
        minX: -1000,
        maxX: 1000,
        minY: -1000,
        baseDriftX: 0,
        baseDriftY: 0,
        motionX: x,
        motionY: y,
        motionRotate: rotate,
      };
    })
  );

  useEffect(() => {
    const handleResize = () => {
      // Dynamically find the actual section or container this component is rendered inside
      let absoluteFloorY = window.innerHeight;
      let absoluteLeft = 0;
      let absoluteRight = window.innerWidth;
      let absoluteTop = 0;

      const firstGhost = document.getElementById('ghost-slot-0');
      if (firstGhost) {
        const container = firstGhost.closest('section') || firstGhost.parentElement?.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          absoluteFloorY = containerRect.bottom;
          absoluteLeft = containerRect.left;
          absoluteRight = containerRect.right;
          absoluteTop = containerRect.top;
        }
      }

      const newOffsets = items.map((_, i) => {
        const el = document.getElementById(`ghost-slot-${i}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const b = physicsState.current[i];

          // Floor is mapped precisely to the bottom of the section
          b.targetFloorY = absoluteFloorY - rect.top - rect.height;

          // True screen/container edges
          b.minX = absoluteLeft - rect.left;
          b.maxX = absoluteRight - rect.left - rect.width;

          // Ceiling bound mapped precisely to the top of the section
          b.minY = absoluteTop - rect.top;

          // Store exact dimensions for AABB box collision
          b.width = rect.width * 1.0;
          b.height = rect.height * 1.0;

          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
        return { x: 0, y: 0 };
      });
      layoutOffsetsRef.current = newOffsets;
    };

    window.addEventListener("resize", handleResize);
    // Add small delay to ensure DOM is fully laid out before measuring
    setTimeout(handleResize, 100);

    return () => window.removeEventListener("resize", handleResize);
  }, [items.length]);

  const handleSnapChange = (index, snapped) => {
    setSnappedCount((prev) => prev + (snapped ? 1 : -1));
    const b = physicsState.current[index];
    b.isSnapped = snapped;
    if (snapped) {
      b.vx = 0;
      b.vy = 0;
    }
  };

  const handleDragStateChange = (index, dragging, vx = 0, vy = 0) => {
    const b = physicsState.current[index];
    b.isDragging = dragging;
    
    // Transfer throw momentum from Framer Motion to custom physics engine
    if (!dragging) {
      b.vx = vx * 0.8; // Scale down slightly for better feel
      b.vy = vy * 0.8;
    } else {
      b.vx = 0;
      b.vy = 0;
    }
  };

  const handleDrop = (index) => {
    const b = physicsState.current[index];
    if (!b.isDropped) {
      b.isDropped = true;
      setDroppedCount((prev) => prev + 1);

      // Calculate outward bias based on index
      const normalizedIndex = (index / (items.length - 1)) * 2 - 1;

      // Give a slight horizontal push outward to start the heavy scatter
      b.vx = normalizedIndex * 200 + (Math.random() - 0.5) * 100;
      b.vy = 0;
    }
  };

  // Custom Physics Engine Loop
  useAnimationFrame((time, delta) => {
    const bodies = physicsState.current;
    const offsets = layoutOffsetsRef.current;
    if (offsets.length === 0) return;

    // Cap delta time to prevent tunneling on lag spikes
    const dt = Math.min(delta / 1000, 0.05);

    const gravity = 1200; // More natural gravity
    const floorFriction = 0.95; // Slides a bit smoother

    // 1. Apply gravity, velocity, and floor bounds
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b.isDropped) continue;

      // If being dragged or already snapped, sync physics position TO visual position
      if (b.isDragging || b.isSnapped) {
        b.x = b.motionX.get();
        b.y = b.motionY.get();
        b.vx = 0;
        b.vy = 0;
        continue;
      }

      // Update position
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (!b.hasHitFloor) {
        // Gravity accelerates
        b.vy += gravity * dt;

        // Floor collision (hits floor, then enters zero-G float state)
        if (b.y >= b.targetFloorY) {
          b.y = b.targetFloorY;
          b.hasHitFloor = true; // Trigger floating!

          // Initial bounce upward and outward to start the float
          b.vy = -100 - Math.random() * 100;
          b.vx += (Math.random() - 0.5) * 150;

          // Assign a permanent, unique drifting current (like bubbles)
          b.baseDriftX = (Math.random() - 0.5) * 60;
          b.baseDriftY = -15 - Math.random() * 30; // Mostly drift slowly upwards
        }
      } else {
        // -----------------------------
        // Floating Zero-G Physics Mode (Ambient Drift)
        // -----------------------------
        const timeSec = time / 1000;

        // Add gentle swaying motion on top of the base drift
        const swayX = Math.sin(timeSec * 1.5 + i * 2) * 20;
        const swayY = Math.cos(timeSec * 1.1 + i * 2) * 10;

        // Apply air friction to settle high-speed throws
        b.vx *= 0.98;
        b.vy *= 0.98;

        // Smoothly interpolate current velocity towards the desired drift velocity
        b.vx += (b.baseDriftX + swayX - b.vx) * 0.03;
        b.vy += (b.baseDriftY + swayY - b.vy) * 0.03;

        // Hard Bounce Boundaries
        const bounce = 0.6; // Bouncier walls

        // Left wall bounce
        if (b.x < b.minX) {
          b.x = b.minX;
          b.vx = Math.abs(b.vx) * bounce;
          b.baseDriftX = Math.abs(b.baseDriftX); // Reverse drift current away from wall
        }
        // Right wall bounce
        else if (b.x > b.maxX) {
          b.x = b.maxX;
          b.vx = -Math.abs(b.vx) * bounce;
          b.baseDriftX = -Math.abs(b.baseDriftX);
        }

        // Top ceiling bounce
        if (b.y < b.minY) {
          b.y = b.minY;
          b.vy = Math.abs(b.vy) * bounce;
          b.baseDriftY = Math.abs(b.baseDriftY);
        }
        // Bottom floor bounce
        else if (b.y > b.targetFloorY) {
          b.y = b.targetFloorY;
          b.vy = -Math.abs(b.vy) * bounce;
          b.baseDriftY = -Math.abs(b.baseDriftY);
        }
      }
    }

    // 2. Resolve Overlaps (Positional Correction Constraint Solver)
    // Runs multiple iterations for stability when letters pile up
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const b1 = bodies[i];
          const b2 = bodies[j];

          if (!b1.isDropped || !b2.isDropped) continue;
          if (b1.isSnapped && b2.isSnapped) continue;

          // Convert relative flex offsets to common absolute coordinate space
          const trueX1 = offsets[i].x + b1.x;
          const trueY1 = offsets[i].y + b1.y;
          const trueX2 = offsets[j].x + b2.x;
          const trueY2 = offsets[j].y + b2.y;

          const dx = trueX2 - trueX1;
          const dy = trueY2 - trueY1;
          
          // AABB Box Collision
          const overlapX = (b1.width / 2 + b2.width / 2) - Math.abs(dx);
          const overlapY = (b1.height / 2 + b2.height / 2) - Math.abs(dy);

          // If boxes intersect
          if (overlapX > 0 && overlapY > 0) {
            let overlap, nx, ny;

            // Resolve along the axis of least penetration
            if (overlapX < overlapY) {
              overlap = overlapX;
              nx = dx > 0 ? 1 : -1;
              ny = 0;
            } else {
              overlap = overlapY;
              nx = 0;
              ny = dy > 0 ? 1 : -1;
            }

            // Weight resolution based on immovable objects (snapped or dragged)
            let weight1 = (b1.isDragging || b1.isSnapped) ? 0 : 0.5;
            let weight2 = (b2.isDragging || b2.isSnapped) ? 0 : 0.5;

            // If one is immovable, the other takes 100% of the push to avoid sinking
            if (weight1 === 0 && weight2 > 0) weight2 = 1.0;
            if (weight2 === 0 && weight1 > 0) weight1 = 1.0;

            // Limit correction per frame for stability
            const correction = Math.min(overlap * 0.3, 10);
            const stackNudge = Math.abs(nx) < 0.2 ? (Math.random() > 0.5 ? 1 : -1) : 0;

            if (weight1 > 0) {
              b1.x -= (nx * correction * (weight1 / 0.5)) + stackNudge;
              b1.y -= (ny * correction * (weight1 / 0.5));
            }
            if (weight2 > 0) {
              b2.x += (nx * correction * (weight2 / 0.5)) - stackNudge;
              b2.y += (ny * correction * (weight2 / 0.5));
            }
          }
        }
      }

      // Enforce floor bounds strictly after resolving overlap
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.y > b.targetFloorY) {
          b.y = b.targetFloorY;
        }
      }
    }

    // 3. Write positions back to visual MotionValues
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.isDropped && !b.isDragging && !b.isSnapped) {
        b.motionX.set(b.x);
        b.motionY.set(b.y);

        // Tumbling calculation
        const currentRot = b.motionRotate.get();
        if (b.hasHitFloor) {
          // Slow, dreamy rotation while floating
          b.motionRotate.set(currentRot + b.vx * dt * 0.05 + Math.sin(time / 1000 + i) * 0.2);
        } else {
          // Natural tumble while dropping or thrown
          b.motionRotate.set(currentRot + b.vx * dt * 0.15);
        }
      }
    }
  });

  return (
    <>
      <motion.div
        className="fixed pointer-events-none z-[200] px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F5F5F5] text-[10px] tracking-[0.2em] whitespace-nowrap shadow-xl"
        style={{
          x: smoothX,
          y: smoothY,
          left: 15, 
          top: 15,
          fontFamily: "'Monument Extended', 'Druk Wide', 'Syne', sans-serif",
          textTransform: "uppercase"
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: (isHovering || isHoveringLetter) && !isComplete ? 1 : 0, 
          scale: (isHovering || isHoveringLetter) && !isComplete ? 1 : 0.8 
        }}
        transition={{ duration: 0.2 }}
      >
        {tooltipText}
      </motion.div>

      <div
        className={cn(
          "relative inline-flex flex-wrap justify-center z-50 perspective-1000",
          className
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 flex flex-wrap justify-center pointer-events-none">
          {/* We moved the ghost rendering directly into DraggableLetter so it aligns perfectly */}
        </div>

      {items.map((item, index) => (
        <DraggableLetter
          key={index}
          item={item}
          index={index}
          items={items}
          body={physicsState.current[index]}
          containerRef={containerRef}
          isComplete={isComplete}
          anyDropped={droppedCount > 0}
          onSnapChange={handleSnapChange}
          onDragStateChange={handleDragStateChange}
          onDrop={() => handleDrop(index)}
          onHoverChange={handleHoverChange}
        />
      ))}
      </div>
    </>
  );
}
