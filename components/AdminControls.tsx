"use client";

import { useState, useTransition } from "react";
import { updateTournamentConfig } from "@/app/admin/actions";
import type { TournamentPhase } from "@/lib/db";
import { Lock, Unlock, Settings, Timer } from "lucide-react";

const PHASES: { key: TournamentPhase; label: string }[] = [
  { key: "eliminatorias", label: "Clasificación" },
  { key: "grupos", label: "Fase de Grupos" },
  { key: "octavos", label: "Octavos" },
  { key: "cuartos", label: "Cuartos" },
  { key: "semifinal", label: "Semifinal" },
  { key: "final", label: "Final" },
  { key: "terminado", label: "Terminado" },
];

// Convert UTC ISO string to local datetime-local input value
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminControls({
  config,
}: {
  config: { phase: TournamentPhase; maxQualifiers: number; nominationsOpen: boolean; phaseEndsAt: string | null };
}) {
  const [phase, setPhase] = useState(config.phase);
  const [maxQ, setMaxQ] = useState(config.maxQualifiers);
  const [nomOpen, setNomOpen] = useState(config.nominationsOpen);
  const [endsAt, setEndsAt] = useState(toLocalInput(config.phaseEndsAt));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      // Convert local datetime-local string back to UTC ISO
      const phaseEndsAt = endsAt ? new Date(endsAt).toISOString() : null;
      await updateTournamentConfig({ phase, maxQualifiers: maxQ, nominationsOpen: nomOpen, phaseEndsAt });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const dirty =
    phase !== config.phase ||
    maxQ !== config.maxQualifiers ||
    nomOpen !== config.nominationsOpen ||
    toLocalInput(config.phaseEndsAt) !== endsAt;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
      <h2 className="font-display text-xl text-white tracking-wider flex items-center gap-2">
        <Settings size={16} className="text-white/40" />
        CONFIGURACIÓN
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-xs text-white/40 uppercase tracking-wider">Fase actual</label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as TournamentPhase)}
            className="w-full bg-white/10 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none focus:border-rust"
          >
            {PHASES.map((p) => (
              <option key={p.key} value={p.key} className="bg-ink">{p.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-xs text-white/40 uppercase tracking-wider">Clasifican al mundial</label>
          <select
            value={maxQ}
            onChange={(e) => setMaxQ(Number(e.target.value))}
            className="w-full bg-white/10 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none focus:border-rust"
          >
            {[16, 24, 32].map((n) => (
              <option key={n} value={n} className="bg-ink">{n} autos</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cuenta regresiva */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-1.5">
          <Timer size={12} />
          Cuenta regresiva — cierre de fase
        </label>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="flex-1 bg-white/10 text-white rounded-xl px-3 py-2.5 text-sm border border-white/10 outline-none focus:border-rust [color-scheme:dark]"
          />
          {endsAt && (
            <button
              type="button"
              onClick={() => setEndsAt("")}
              className="text-white/30 hover:text-crimson text-xs px-2 py-2.5"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-xs text-white/25">Aparece en la home como countdown. Dejá vacío para no mostrar.</p>
      </div>

      {/* Toggle nominaciones */}
      <button
        type="button"
        onClick={() => setNomOpen((v) => !v)}
        className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-medium transition-colors ${
          nomOpen
            ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/15"
            : "bg-crimson/10 border-crimson/20 text-crimson hover:bg-crimson/15"
        }`}
      >
        {nomOpen ? <Unlock size={15} /> : <Lock size={15} />}
        Clasificación {nomOpen ? "ABIERTA" : "CERRADA"}
        <span className="ml-auto text-white/20 text-xs font-normal">Tap para cambiar</span>
      </button>

      <button
        onClick={handleSave}
        disabled={isPending || (!dirty && !saved)}
        className={`w-full font-display text-xl py-3 rounded-xl tracking-wide transition-all ${
          saved ? "bg-green-600 text-white" :
          dirty ? "bg-rust hover:bg-rust-dark text-white" :
          "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isPending ? "GUARDANDO..." : saved ? "GUARDADO ✓" : "GUARDAR CAMBIOS"}
      </button>
    </div>
  );
}
