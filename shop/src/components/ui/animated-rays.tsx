"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedRaysProps {
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedRays({
  className = "",
  children,
}: AnimatedRaysProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stripes = `repeating-linear-gradient(
    100deg,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.7) 7%,
    transparent 10%,
    transparent 12%,
    rgba(255, 255, 255, 0.7) 16%
  )`;
  const rainbow = `repeating-linear-gradient(
    100deg,
    #fef3c7 10%,
    #fed7aa 15%,
    #fef08a 20%,
    #e0f2fe 25%,
    #fef3c7 30%
  )`;

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Subtle Warm Aurora Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `${stripes}, ${rainbow}`,
          backgroundSize: "300%, 200%",
          backgroundPosition: "50% 50%, 50% 50%",
          filter: "blur(18px)",
          maskImage: "radial-gradient(ellipse at 80% 20%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 80% 20%, black 20%, transparent 80%)",
        }}
      >
        <div
          className="absolute inset-0 animate-aurora-bg"
          style={{
            backgroundImage: `${stripes}, ${rainbow}`,
            backgroundSize: "200%, 100%",
            backgroundAttachment: "fixed",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default AnimatedRays;
