"use client";

import { useState, useEffect } from "react";

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function CountdownTimer({ endsAt, label = "Cierra en" }: { endsAt: string; label?: string }) {
  const [left, setLeft] = useState(() => getTimeLeft(endsAt));

  useEffect(() => {
    const id = setInterval(() => setLeft(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!left) return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">¡Tiempo terminado!</span>
    </div>
  );

  const Unit = ({ value, unit }: { value: number; unit: string }) => (
    <div className="flex flex-col items-center min-w-[2.2rem]">
      <span className="font-display text-2xl leading-none tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="text-[9px] opacity-50 uppercase tracking-wider mt-0.5">{unit}</span>
    </div>
  );

  return (
    <div className="mt-3 flex items-center gap-2.5 justify-center md:justify-start flex-wrap">
      <span className="text-[11px] font-semibold opacity-60 uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-1">
        {left.d > 0 && (
          <>
            <Unit value={left.d} unit="d" />
            <span className="font-display text-lg opacity-30 mb-3">:</span>
          </>
        )}
        <Unit value={left.h} unit="hs" />
        <span className="font-display text-lg opacity-30 mb-3">:</span>
        <Unit value={left.m} unit="min" />
        <span className="font-display text-lg opacity-30 mb-3">:</span>
        <Unit value={left.s} unit="seg" />
      </div>
    </div>
  );
}
