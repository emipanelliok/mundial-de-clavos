import Link from "next/link";
import { getTournamentStats, getTopNominations } from "./actions";
import PhaseBar from "@/components/PhaseBar";
import { Trophy, Users, Car, ChevronRight, Lock } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import type { TournamentPhase } from "@/lib/db";

export const revalidate = 30;

const PHASE_INFO: Record<string, { label: string; desc: string; color: string }> = {
  eliminatorias: { label: "CLASIFICACIONES",    desc: "Votá los autos más clavos. Los más votados van al Mundial.",    color: "bg-rust text-white" },
  grupos:        { label: "FASE DE GRUPOS",      desc: "Los grupos están armados. Votá quién pasa de ronda.",           color: "bg-crimson text-white" },
  octavos:       { label: "OCTAVOS DE FINAL",    desc: "16 clavos quedan. Solo 8 avanzan. Votá ahora.",                color: "bg-crimson text-white" },
  cuartos:       { label: "CUARTOS DE FINAL",    desc: "Los 8 mejores se enfrentan. Elegí al más clavo.",              color: "bg-crimson text-white" },
  semifinal:     { label: "SEMIFINAL",           desc: "Solo quedan 4. ¿Quién llega a la final?",                      color: "bg-gold text-ink" },
  final:         { label: "LA GRAN FINAL",       desc: "Dos clavos. Un campeón. Votá al peor auto de la historia.",    color: "bg-gold text-ink" },
  terminado:     { label: "CAMPEÓN CORONADO",    desc: "El Mundial de Clavos terminó. Conocé al gran ganador.",        color: "bg-ink text-cream" },
};

export default async function HomePage() {
  const [stats, topCars] = await Promise.all([
    getTournamentStats(),
    getTopNominations(3),
  ]);

  const phase = stats.phase as TournamentPhase;
  const isEliminatorias = phase === "eliminatorias";
  const phaseInfo = PHASE_INFO[phase] ?? PHASE_INFO.eliminatorias;
  const phaseEndsAt = stats.phaseEndsAt;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="bg-ink px-4 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-gold font-display text-sm tracking-[0.3em] mb-1">ARGENTINA · 2026</p>
          <h1 className="font-display text-6xl sm:text-7xl leading-none mb-6">
            <span className="text-cream">MUNDIAL</span>
            <br />
            <span className="text-crimson">DE CLAVOS</span>
          </h1>

          {/* Fase actual — prominente */}
          <div className={`${phaseInfo.color} rounded-2xl px-4 py-3 mb-4`}>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-widest mb-0.5">ESTAMOS EN</p>
            <p className="font-display text-3xl leading-none">{phaseInfo.label}</p>
            <p className="text-sm opacity-80 mt-1">{phaseInfo.desc}</p>
            {phaseEndsAt && <CountdownTimer endsAt={phaseEndsAt} label="Cierra en" />}
          </div>

          {/* Timeline secundario */}
          <PhaseBar phase={phase} />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users size={15} className="text-rust shrink-0" />
            <span className="text-ink font-semibold">{stats.totalVoters.toLocaleString()}</span>
            <span className="text-muted">votantes</span>
          </div>
          <div className="w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Car size={15} className="text-rust shrink-0" />
            <span className="text-ink font-semibold">{stats.totalNominations.toLocaleString()}</span>
            <span className="text-muted">clasificados</span>
          </div>
          <div className="w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Trophy size={15} className="text-gold shrink-0" />
            <span className="text-ink font-semibold">{stats.maxQualifiers}</span>
            <span className="text-muted">al mundial</span>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="px-4 py-6 max-w-lg mx-auto w-full space-y-3">
        {stats.nominationsOpen && (
          <Link
            href="/nominaciones"
            className="flex items-center justify-between w-full bg-rust text-white rounded-2xl px-5 py-4 shadow-lg shadow-rust/25 hover:bg-rust-dark active:scale-[0.98] transition-all"
          >
            <div>
              <p className="font-display text-2xl tracking-wide">CLASIFICAR AL MUNDIAL</p>
              <p className="text-white/70 text-xs mt-0.5">Elegí los autos más clavos · hasta 5 por persona</p>
            </div>
            <ChevronRight size={20} className="shrink-0" />
          </Link>
        )}
        <Link
          href="/fixture"
          className="flex items-center justify-between w-full bg-white border-2 border-border rounded-2xl px-5 py-4 hover:border-rust/40 active:scale-[0.98] transition-all"
        >
          <div>
            <p className="font-display text-2xl text-ink tracking-wide">VER FIXTURE</p>
            <p className="text-muted text-xs mt-0.5">Los grupos y el bracket del Mundial</p>
          </div>
          <ChevronRight size={20} className="text-muted shrink-0" />
        </Link>
      </section>

      {/* Top 3 + sorpresa (durante clasificación) */}
      {isEliminatorias && topCars.length > 0 && (
        <section className="px-4 pb-8 max-w-lg mx-auto w-full">
          <div className="bg-white border-2 border-border rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <p className="font-display text-xl text-ink tracking-wide">LOS PUNTEROS</p>
              <p className="text-xs text-muted">Solo los 3 primeros · el resto es secreto</p>
            </div>
            <div className="divide-y divide-border">
              {topCars.map((car, i) => (
                <div key={car.car_name} className="flex items-center gap-3 px-4 py-3">
                  <span className={`font-display text-2xl w-7 text-center shrink-0 ${i === 0 ? "text-gold" : i === 1 ? "text-muted" : "text-crimson/60"}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-ink font-medium truncate">{car.car_name}</span>
                  <span className="text-xs text-muted bg-surface px-2 py-1 rounded-lg shrink-0">
                    {car.total_nominations} {car.total_nominations === 1 ? "voto" : "votos"}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-surface flex items-center gap-2">
              <Lock size={13} className="text-muted shrink-0" />
              <p className="text-xs text-muted">El ranking completo se revela al cerrar la clasificación.</p>
            </div>
          </div>
        </section>
      )}

      {/* Ranking completo post-clasificación */}
      {!isEliminatorias && topCars.length > 0 && (
        <section className="px-4 pb-8 max-w-lg mx-auto w-full">
          <h2 className="font-display text-2xl text-ink mb-4 tracking-wide">CLASIFICADOS AL MUNDIAL</h2>
          <div className="space-y-2">
            {topCars.map((car, i) => (
              <div key={car.car_name} className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3">
                <span className={`font-display text-xl w-7 text-center shrink-0 ${i === 0 ? "text-gold" : i === 1 ? "text-muted" : "text-crimson/60"}`}>{i + 1}</span>
                <span className="flex-1 text-sm text-ink font-medium truncate">{car.car_name}</span>
                <span className="text-xs text-muted shrink-0">{car.total_nominations} votos</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-auto px-4 py-6 text-center border-t border-border">
        <p className="text-xs text-muted">
          Mundial de Clavos 2026 · por{" "}
          <a href="https://x.com/emipanelli" target="_blank" rel="noopener noreferrer" className="text-rust font-medium">@emipanelli</a>
        </p>
      </footer>
    </main>
  );
}
