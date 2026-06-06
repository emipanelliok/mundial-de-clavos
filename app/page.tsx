import Link from "next/link";
import { getTournamentStats, getTopNominations, getRandomContenders } from "./actions";
import PhaseBar from "@/components/PhaseBar";
import { Trophy, Users, Car, ChevronRight, Lock } from "lucide-react";
import HowItWorks from "@/components/HowItWorks";
import CountdownTimer from "@/components/CountdownTimer";
import type { TournamentPhase } from "@/lib/db";

export const revalidate = 30;

const PHASE_INFO: Record<string, { label: string; desc: string }> = {
  eliminatorias: { label: "CLASIFICACIONES",  desc: "Votá los autos más clavos. Los más votados van al Mundial." },
  grupos:        { label: "FASE DE GRUPOS",   desc: "Los grupos están armados. Votá quién pasa de ronda." },
  octavos:       { label: "OCTAVOS DE FINAL", desc: "16 clavos quedan. Solo 8 avanzan. Votá ahora." },
  cuartos:       { label: "CUARTOS DE FINAL", desc: "Los 8 mejores se enfrentan. Elegí al más clavo." },
  semifinal:     { label: "SEMIFINAL",        desc: "Solo quedan 4. ¿Quién llega a la final?" },
  final:         { label: "LA GRAN FINAL",    desc: "Dos clavos. Un campeón. Votá al peor auto de la historia." },
  terminado:     { label: "CAMPEÓN CORONADO", desc: "El Mundial de Clavos terminó. Conocé al gran ganador." },
};

export default async function HomePage() {
  const [stats, topCars, contenders] = await Promise.all([
    getTournamentStats(),
    getTopNominations(3),
    getRandomContenders(20),
  ]);

  const phase = stats.phase as TournamentPhase;
  const isEliminatorias = phase === "eliminatorias";
  const phaseInfo = PHASE_INFO[phase] ?? PHASE_INFO.eliminatorias;
  const phaseEndsAt = stats.phaseEndsAt;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="bg-ink px-4 pt-10 pb-8">
        <div className="max-w-5xl mx-auto text-center md:text-left">
          <p className="text-cream/40 font-display text-sm tracking-[0.3em] mb-1">ARGENTINA · 2026</p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-logo.png"
            alt="Mundial de Clavos 2026"
            className="h-32 sm:h-40 md:h-48 w-auto mb-4 object-contain mx-auto md:mx-0"
          />

          <p className="text-cream/50 text-sm mb-6 max-w-xl leading-relaxed mx-auto md:mx-0">
            El torneo definitivo del auto más clavo de la historia.
            Clasificá los peores, votá en cada ronda, y coroná al Gran Campeón.
          </p>

          {/* Fase actual — única aparición del rojo */}
          <div className="bg-crimson text-white rounded-2xl px-4 py-3 mb-4 max-w-xl mx-auto md:mx-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-current opacity-70 animate-pulse shrink-0" />
              <p className="text-xs font-semibold opacity-70 uppercase tracking-widest">ESTAMOS EN</p>
            </div>
            <p className="font-display text-3xl leading-none">{phaseInfo.label}</p>
            <p className="text-sm opacity-80 mt-1">{phaseInfo.desc}</p>
            {phaseEndsAt && <CountdownTimer endsAt={phaseEndsAt} label="Cierra en" />}
          </div>

          <PhaseBar phase={phase} />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex gap-4 flex-wrap">
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

      {/* CTAs + top */}
      <section className="px-4 py-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: CTAs */}
          <div className="space-y-3">
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
            <HowItWorks />
          </div>

          {/* Right: Contenders / Ranking */}
          {isEliminatorias && contenders.total >= 10 && contenders.cars.length > 0 ? (
            <div className="bg-white border-2 border-border rounded-2xl overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <p className="font-display text-xl text-ink tracking-wide">ALGUNOS QUE ESTÁN EN LA CARRERA</p>
                <p className="text-xs text-muted">{contenders.total} candidatos · el ranking es secreto</p>
              </div>
              <div className="px-4 py-4 flex flex-wrap gap-2">
                {contenders.cars.slice(0, 10).map((car) => (
                  <span key={car} className="bg-surface border border-border text-ink text-sm px-3 py-1.5 rounded-full">
                    {car}
                  </span>
                ))}
              </div>
              <div className="px-4 py-3 bg-surface border-t border-border flex items-center gap-2">
                <Lock size={13} className="text-muted shrink-0" />
                <p className="text-xs text-muted">El ranking completo se revela al cerrar la clasificación.</p>
              </div>
            </div>
          ) : !isEliminatorias && topCars.length > 0 ? (
            <div className="space-y-2">
              <h2 className="font-display text-2xl text-ink tracking-wide">CLASIFICADOS AL MUNDIAL</h2>
              {topCars.map((car, i) => (
                <div key={car.car_name} className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3">
                  <span className={`font-display text-xl w-7 text-center shrink-0 ${i === 0 ? "text-gold" : i === 1 ? "text-muted" : "text-crimson/60"}`}>{i + 1}</span>
                  <span className="flex-1 text-sm text-ink font-medium truncate">{car.car_name}</span>
                  <span className="text-xs text-muted shrink-0">{car.total_nominations} votos</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <footer className="mt-auto px-4 py-6 text-center border-t border-border">
        <p className="text-xs text-muted">
          Mundial de Clavos 2026 · por{" "}
          <a href="https://x.com/emipanelli" target="_blank" rel="noopener noreferrer" className="text-rust font-medium">@emipanelli</a>
        </p>
      </footer>
    </main>
  );
}
