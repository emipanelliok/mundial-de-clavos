"use client";

import { useState, useEffect, useRef } from "react";
import { SEED_CARS } from "@/lib/cars";

interface CarSlotProps {
  cars?: string[];
}

export default function CarSlot({ cars }: CarSlotProps) {
  const pool = cars && cars.length >= 6 ? cars : SEED_CARS;
  // shuffle once on mount
  const shuffled = useRef([...pool].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const HOLD = 1800;
    const TRANS = 350;
    let timeout: ReturnType<typeof setTimeout>;

    const cycle = () => {
      setPhase("out");
      timeout = setTimeout(() => {
        setIndex((i) => (i + 1) % shuffled.current.length);
        setPhase("in");
        timeout = setTimeout(() => {
          setPhase("hold");
          timeout = setTimeout(cycle, HOLD);
        }, TRANS);
      }, TRANS);
    };

    timeout = setTimeout(() => {
      setPhase("hold");
      timeout = setTimeout(cycle, HOLD);
    }, TRANS);

    return () => clearTimeout(timeout);
  }, []);

  const styles: Record<string, React.CSSProperties> = {
    in:   { opacity: 0, transform: "translateY(28px)" },
    hold: { opacity: 1, transform: "translateY(0)" },
    out:  { opacity: 0, transform: "translateY(-28px)" },
  };

  return (
    <div className="h-14 sm:h-16 overflow-hidden flex items-center">
      <span
        style={{ transition: "opacity 0.35s ease, transform 0.35s ease", ...styles[phase] }}
        className="font-display text-4xl sm:text-5xl text-white leading-none block"
      >
        {shuffled.current[index]}
      </span>
    </div>
  );
}
