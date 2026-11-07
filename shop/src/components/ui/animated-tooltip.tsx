"use client";

import * as React from "react";
import { useState, useId } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export type AnimatedTooltipVariant =
  | "cora"
  | "smaug"
  | "dori"
  | "sadoc";

interface VariantConfig {
  width: number;
  height: number;
  bottom: string;
  transformOrigin: string;
  shape: (fill: string) => React.ReactNode;
  base: Variants;
  content: Variants;
  contentStyle?: React.CSSProperties;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN: [number, number, number, number] = [0.55, 0, 1, 0.45];

const VARIANTS: Record<AnimatedTooltipVariant, VariantConfig> = {
  // Blobby rounded bubble with subtle spring
  cora: {
    width: 232,
    height: 174,
    bottom: "calc(100% + 0.5rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 199,21.9 C 152,22.2 109,35.7 78.8,57.4 48,79.1 29,109 29,142 29,172 45.9,201 73.6,222 101,243 140,258 183,260 189,270 200,282 200,282 200,282 211,270 217,260 261,258 299,243 327,222 354,201 371,172 371,142 371,109 352,78.7 321,57 290,35.3 247,21.9 199,21.9 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { scale: 0, rotate: -180, opacity: 0 },
      animate: { scale: 1, rotate: 0, opacity: 1, transition: { duration: 0.6, ease: EASE_OUT_QUINT } },
      exit: { scale: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_IN } },
    },
    content: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { duration: 0.3, delay: 0.25, ease: EASE_OUT_QUINT } },
      exit: { y: 20, opacity: 0, transition: { duration: 0.1, ease: EASE_IN } },
    },
    contentStyle: { marginBottom: "0.75em" },
  },

  // Pill with downward pointer
  smaug: {
    width: 240,
    height: 180,
    bottom: "calc(100% - 0.25rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 314,100 C 313,100 312,100 311,100 L 89.5,100 C 55.9,100 29.1,121 29.1,150 29.1,178 53.1,201 89.5,201 L 184,201 200,223 217,201 311,201 C 344,201 371,178 371,150 371,122 346,99 314,100 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { rotate: 35, opacity: 0 },
      animate: { rotate: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
      exit: { rotate: -35, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
    content: {
      initial: { x: 50, rotate: 6, opacity: 0 },
      animate: { x: 0, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 12, delay: 0.05 } },
      exit: { x: -30, rotate: -6, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
  },

  // Elastic bounce banner
  dori: {
    width: 240,
    height: 180,
    bottom: "calc(100% - 0.25rem)",
    transformOrigin: "50% 0%",
    shape: (fill) => (
      <path
        d="M 22,108 22,236 C 22,236 64,216 103,212 142,208 184,212 184,212 L 200,229 216,212 C 216,212 258,207 297,212 336,217 378,236 378,236 L 378,108 C 378,108 318,83.7 200,83.7 82,83.7 22,108 22,108 Z"
        fill={fill}
      />
    ),
    base: {
      initial: { y: -60, scale: 0.5, opacity: 0 },
      animate: { y: 0, scale: 1, opacity: 1, transition: { type: "spring", bounce: 0.5, duration: 0.8 } },
      exit: { y: -60, scale: 0.5, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
    content: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { duration: 0.3, delay: 0.1, ease: EASE_OUT_QUINT } },
      exit: { y: 20, opacity: 0, transition: { duration: 0.1, ease: EASE_IN } },
    },
    contentStyle: { marginBottom: "0.5em" },
  },

  // Outlined speech bubble
  sadoc: {
    width: 240,
    height: 180,
    bottom: "calc(100% + 0.5rem)",
    transformOrigin: "50% 100%",
    shape: (fill) => (
      <path
        d="M 32.1,42.7 54.5,257 185,257 193,269 200,282 207,269 214,257 342,257 368,23.9 Z"
        fill={fill}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    ),
    base: {
      initial: { y: -40, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.5, duration: 0.8 } },
      exit: { y: -40, opacity: 0, transition: { duration: 0.2, ease: EASE_IN } },
    },
    content: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4, duration: 0.8, delay: 0.2 } },
      exit: { y: 20, opacity: 0, transition: { duration: 0.15, ease: EASE_IN } },
    },
    contentStyle: { marginBottom: "1.25em" },
  },
};

export interface AnimatedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  variant?: AnimatedTooltipVariant;
  accentColor?: string;
  shapeColor?: string;
  textColor?: string;
  className?: string;
}

export function AnimatedTooltip({
  children,
  content,
  variant = "cora",
  accentColor = "#2563eb",
  shapeColor = "#1c1917",
  textColor = "#ffffff",
  className,
}: AnimatedTooltipProps) {
  const [open, setOpen] = useState(false);
  const cfg = VARIANTS[variant] ?? VARIANTS.cora;
  const id = useId().replace(/:/g, "");

  return (
    <span
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        className="cursor-pointer select-none inline-flex items-center"
      >
        {children}
      </span>

      <span
        aria-hidden={!open}
        style={{
          position: "absolute",
          bottom: cfg.bottom,
          left: "50%",
          width: cfg.width,
          height: cfg.height,
          marginLeft: -cfg.width / 2,
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <AnimatePresence>
          {open && (
            <motion.span
              key="base"
              id={id}
              role="tooltip"
              variants={cfg.base}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transformOrigin: cfg.transformOrigin,
              }}
            >
              <svg
                viewBox="0 0 400 300"
                preserveAspectRatio="xMidYMid meet"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                aria-hidden="true"
              >
                {cfg.shape(shapeColor)}
              </svg>
              <motion.span
                variants={cfg.content}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  position: "relative",
                  width: "65%",
                  textAlign: "center",
                  fontSize: "0.75rem",
                  lineHeight: 1.3,
                  color: textColor,
                  ...cfg.contentStyle,
                }}
              >
                {content}
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

export default AnimatedTooltip;
