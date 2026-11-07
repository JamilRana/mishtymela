"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ children, className, icon, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border border-stone-300 bg-white p-2.5 px-6 text-center text-xs sm:text-sm font-semibold text-stone-900 transition-colors shadow-xs hover:border-stone-900",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-stone-900 transition-all duration-[var(--vng-transition-speed-slow,300ms)] group-hover:scale-[100.8]" />
        <span className="inline-block transition-all duration-[var(--vng-transition-speed-slow,300ms)] group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="absolute top-0 left-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-[var(--vng-transition-speed-slow,300ms)] group-hover:translate-x-0 group-hover:opacity-100">
        <span>{children}</span>
        {icon || <ArrowRight className="w-4 h-4" />}
      </div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export default InteractiveHoverButton;
