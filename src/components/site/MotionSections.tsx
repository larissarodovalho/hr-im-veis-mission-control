import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionStyle } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * ScrollSection — wraps a page section with a scroll-driven reveal animation.
 *
 * Desktop: full effect (y, opacity, scale, rotateX, blur, perspective + fade edges).
 * Mobile: lightweight one-shot fade-in only — no blur, no rotateX, no scale, no
 * scroll-linked transforms. Avoids GPU jank on phones.
 */
export function ScrollSection({
  children,
  className = "",
  index = 0,
  /** When true, use stronger desktop intensity (Home hero sections). */
  strong = false,
  /** When true, render the top/bottom dark fade edges on desktop. */
  fadeEdges = true,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  strong?: boolean;
  fadeEdges?: boolean;
}) {
  const isMobile = useIsMobile();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Desktop effects
  const y = useTransform(
    scrollYProgress,
    strong ? [0, 0.25, 0.75, 1] : [0, 0.15, 0.8, 1],
    strong ? [150, 0, 0, -80] : [60, 0, 0, -30],
  );
  const opacity = useTransform(
    scrollYProgress,
    strong ? [0, 0.18, 0.82, 1] : [0, 0.1, 0.85, 1],
    [0, 1, 1, 0],
  );
  const scale = useTransform(
    scrollYProgress,
    strong ? [0, 0.25, 0.75, 1] : [0, 0.15, 0.8, 1],
    strong ? [0.88, 1, 1, 0.94] : [0.95, 1, 1, 0.97],
  );
  const rotateX = useTransform(
    scrollYProgress,
    strong ? [0, 0.25, 0.75, 1] : [0, 0.15, 0.8, 1],
    strong ? [6, 0, 0, -4] : [3, 0, 0, -2],
  );
  const filter = useTransform(
    scrollYProgress,
    strong ? [0, 0.2, 0.8, 1] : [0, 0.1, 0.85, 1],
    strong
      ? ["blur(8px)", "blur(0px)", "blur(0px)", "blur(5px)"]
      : ["blur(4px)", "blur(0px)", "blur(0px)", "blur(2px)"],
  );

  if (isMobile) {
    // Mobile: simple one-shot reveal — fluid, no scroll-linked re-paints.
    return (
      <motion.section
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        style={{ zIndex: index }}
        className={`relative ${className}`}
      >
        {children}
      </motion.section>
    );
  }

  const style: MotionStyle = {
    y,
    opacity,
    scale,
    rotateX,
    filter,
    perspective: 1200,
    transformStyle: "preserve-3d",
    zIndex: index,
  };

  return (
    <motion.section ref={ref} initial={{ opacity: 1 }} style={style} className={`relative ${className}`}>
      {fadeEdges && (
        <div
          className={`absolute top-0 left-0 right-0 ${strong ? "h-24" : "h-12"} bg-gradient-to-b from-[#050505] to-transparent z-10 pointer-events-none`}
        />
      )}
      {children}
      {fadeEdges && (
        <div
          className={`absolute bottom-0 left-0 right-0 ${strong ? "h-24" : "h-12"} bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none`}
        />
      )}
    </motion.section>
  );
}

/**
 * ParallaxImage — image with subtle vertical parallax on desktop. On mobile the
 * parallax is disabled (renders a normal lazy <img>) for smoother scroll.
 */
export function ParallaxImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const isMobile = useIsMobile();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  if (isMobile) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y }}
        className="w-full h-[120%] object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
