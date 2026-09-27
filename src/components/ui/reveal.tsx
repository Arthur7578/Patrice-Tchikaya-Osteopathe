"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * Apparition au scroll — UNIQUEMENT sous la ligne de flottaison (jamais hero/LCP).
 * `data-reveal` + <noscript> du layout : contenu visible même sans JS.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <m.div
          data-reveal=""
          className={className}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay }}
        >
          {children}
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
