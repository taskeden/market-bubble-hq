"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";

/** Smoothly tweens between numeric values for a premium "live data" feel. */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
  duration = 0.6,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={cn("tabular", className)}>{format(display)}</span>;
}
