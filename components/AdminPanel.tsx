"use client";

import { useState, useTransition } from "react";
import { updateTournamentConfig } from "@/app/admin/actions";
import type { TournamentPhase } from "@/lib/supabase";
import { Users, Lock, Unlock, Trophy } from "lucide-react";

const PHASES: { key: TournamentPhase; label: string }[] = [
  { key: "eliminatorias", label: "Eliminatorias" },
  { key: "grupos", label: "Fase de Grupos" },
  { key: "octavos", label: "Octavos de Final" },
  { key: "cuartos", label: "Cuartos de Final" },
  { key: "semifinal", label: "Semifinal" },
  { key: "final", label: "Final" },
  { key: "terminado", label: "Terminado" },
];

interface AdminPanelProps {
  config: {
    phase: TournamentPhase;
    maxQualifiers: number;
    nominationsOpen: boolean;
  };
  topCars: { car_name: string; total_nominations: number }[];
  totalVoters: number;
}

export default function AdminPanel({
  config,
  topCars,
  totalVoters,
}: AdminPanelProps) {
  const [phase, setPhase] = useState(config.phase);
  const [maxQ, setMaxQ] = useState(config.maxQualifiers);
  const [nomOpen, setNomOpen] = useState(config.nominationsOpen);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateTournamentConfig({ phase, maxQualifiers: maxQ, nominationsOpen: nomOpen });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4">
        <Users size={20} className="text-gold" />
        <div>
          <p className="text-2xl font-display text-white">{totalVoters.toLocaleString()}</p>
          <p className="text-xs text-white/50">votantes registrados</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-display text-white">{topCars.reduce((s, c) => s + c.total_nominations, 0).toLocaleString()}</p>
          <p className="text-xs text-white/50">nominaciones totales</p>
        </div>
      </div>

      {/* Config */}
      <div className="bg-white/5 rounded-2xl p-4 space-y-4">
        <h2 className="font-display text-xl text-white tracking-wider">CONFIGURACIÓN</h2>

        <div className="space-y-1">
          <label className="text-xs text-white/50 uppercase tracking-wider">Fase actual</label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as TournamentPhase)}
            className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-sm border border-white/10 outline-none focus:border-rust"
          >
            {PHASES.map((p) => (
              <option key={p.key} value={p.key} className="bg-ink">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-white/50 uppercase tracking-wider">
            Clasificados al mundial
          </label>
          <select
            value={maxQ}
            onChange={(e) => setMaxQ(Number(e.target.value))}
            className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-sm border border-white/10 outline-none focus:border-rust"
          >
            {[16, 24, 32].map((n) => (
              <option key={n} value={n} className="bg-ink">
                {n} autos
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setNomOpen((v) => !v)}
          className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-sm transition-colors ${
            nomOpen
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-crimson/10 border-crimson/30 text-crimson"
          }`}
        >
          {nomOpen ? <Unlock size={16} /> : <Lock size={16} />}
          Nominaciones {nomOpen ? "ABIERTAS" : "CERRADAS"}
          <span className="ml-auto text-white/30 text-xs">Click para cambiar</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full bg-rust text-white font-display text-xl py-3 rounded-xl tracking-wide hover:bg-rust-dark transition-colors disabled:opacity-50"
        >
          {isPending ? "GUARDANDO..." : saved ? "GUARDADO ✓" : "GUARDAR CAMBIOS"}
        </button>
      </div>

      {/* Top Cars */}
      <div className="bg-white/5 rounded-2xl p-4 space-y-3">
        <h2 className="font-display text-xl text-white tracking-wider flex items-center gap-2">
          <Trophy size={18} className="text-gold" />
          TOP NOMINADOS
        </h2>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {topCars.map((car, i) => (
            <div
              key={car.car_name}
              className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
            >
              <span className="font-display text-lg text-white/40 w-6 text-center shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-white/90 min-w-0 truncate">
                {car.car_name}
              </span>
              <span className="text-xs text-white/40 shrink-0">
                {car.total_nominations}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
