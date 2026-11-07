"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children?: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children = "Click Me",
  className = "",
  ...rest
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-md border border-stone-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 shadow-xs transition-colors hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:pointer-events-none disabled:opacity-50",
        "[--shine:rgba(0,0,0,0.12)]",
        className
      )}
      {...rest}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      <motion.span
        className="pointer-events-none absolute inset-0 block rounded-md p-px"
        style={{
          background:
            "linear-gradient(-75deg, transparent 30%, var(--shine) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
        }}
        initial={{ backgroundPosition: "100% 0", opacity: 0 }}
        animate={{ backgroundPosition: ["100% 0", "0% 0"], opacity: [0, 1, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1.5,
        }}
      />
    </motion.button>
  );
};

export default AnimatedButton;
