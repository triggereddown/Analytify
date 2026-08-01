import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

const PULL_UP_EASE = [0.16, 1, 0.3, 1];

/**
 * Splits text on spaces and animates each word sliding up into place,
 * staggered. Fires once, the first time it scrolls into view.
 */
export const WordsPullUp = ({ text, className = "", showAsterisk = false }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="mr-[0.25em] overflow-hidden">
          <motion.span
            className="relative inline-block"
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: i * 0.08, ease: PULL_UP_EASE }}
          >
            {word}
            {showAsterisk && i === words.length - 1 && (
              <sup className="absolute top-[0.05em] -right-[0.3em] text-[0.31em]">*</sup>
            )}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

/**
 * Same pull-up mechanics as WordsPullUp, but takes multiple text segments
 * each with their own className (e.g. one segment in italic serif, the
 * rest in the default weight) — every word keeps its segment's styling
 * while the stagger index continues across segment boundaries.
 */
export const WordsPullUpMultiStyle = ({ segments, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  let wordIndex = 0;

  return (
    <span ref={ref} className={`inline-flex flex-wrap justify-center ${className}`}>
      {segments.map((segment, segIndex) =>
        segment.text.split(" ").map((word, i) => {
          const currentIndex = wordIndex;
          wordIndex += 1;
          return (
            <span key={`${segIndex}-${i}`} className="mr-[0.25em] overflow-hidden">
              <motion.span
                className={`relative inline-block ${segment.className ?? ""}`}
                initial={{ y: "100%", opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.7, delay: currentIndex * 0.08, ease: PULL_UP_EASE }}
              >
                {word}
              </motion.span>
            </span>
          );
        }),
      )}
    </span>
  );
};

/** One character of AnimatedText — opacity driven by scroll progress, not by being in/out of view. */
const AnimatedLetter = ({ char, scrollYProgress, range }) => {
  const opacity = useTransform(scrollYProgress, range, [0.2, 1]);
  return (
    <motion.span style={{ opacity }} aria-hidden="true">
      {char}
    </motion.span>
  );
};

/**
 * Progressive text reveal driven by scroll position rather than a one-shot
 * "in view" trigger — each character's opacity ramps up as the paragraph
 * scrolls through the viewport, so reading progress and reveal progress
 * feel tied together. `text` is rendered a second time, visually hidden,
 * for screen readers/copy-paste, since the per-character spans aren't
 * meaningful as individual DOM nodes.
 */
export const ScrollRevealText = ({ text, className = "" }) => {
  const ref = useRef(null);
  // Completes while the paragraph is still comfortably on-screen (its own
  // end reaching the vertical middle of the viewport), not once it's
  // nearly scrolled past entirely — the previous ["start 0.8", "end 0.2"]
  // range meant the last few words never finished fading in unless the
  // user scrolled the whole block almost out of view, which reads as
  // broken/unfinished text on shorter viewports rather than a reveal effect.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.55"] });
  const chars = text.split("");

  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((char, index) => {
          const charProgress = index / chars.length;
          return (
            <AnimatedLetter
              key={index}
              char={char === " " ? " " : char}
              scrollYProgress={scrollYProgress}
              range={[Math.max(0, charProgress - 0.1), charProgress + 0.05]}
            />
          );
        })}
      </span>
    </p>
  );
};
