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

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold opacity-70 uppercase tracking-widest mb-1.5 text-center md:text-left">{label}</p>
      <div className="flex items-end gap-2 justify-center md:justify-start">
        {left.d > 0 && (
          <div className="text-center">
            <span className="font-display text-3xl leading-none">{String(left.d).padStart(2, "0")}</span>
            <p className="text-[10px] opacity-60 uppercase tracking-wider mt-0.5">días</p>
          </div>
        )}
        {left.d > 0 && <span className="font-display text-2xl opacity-40 mb-1">:</span>}
        <div className="text-center">
          <span className="font-display text-3xl leading-none">{String(left.h).padStart(2, "0")}</span>
          <p className="text-[10px] opacity-60 uppercase tracking-wider mt-0.5">hs</p>
        </div>
        <span className="font-display text-2xl opacity-40 mb-1">:</span>
        <div className="text-center">
          <span className="font-display text-3xl leading-none">{String(left.m).padStart(2, "0")}</span>
          <p className="text-[10px] opacity-60 uppercase tracking-wider mt-0.5">min</p>
        </div>
        <span className="font-display text-2xl opacity-40 mb-1">:</span>
        <div className="text-center">
          <span className="font-display text-3xl leading-none">{String(left.s).padStart(2, "0")}</span>
          <p className="text-[10px] opacity-60 uppercase tracking-wider mt-0.5">seg</p>
        </div>
      </div>
    </div>
  );
}
