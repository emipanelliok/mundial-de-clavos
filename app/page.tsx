import Link from "next/link";
import { getTournamentStats, getTopNominations } from "./actions";
import PhaseBar from "@/components/PhaseBar";
import { Trophy, Users, Car, ChevronRight, Flame } from "lucide-react";
import type { TournamentPhase } from "@/lib/db";

export const revalidate = 30;

export default async function HomePage() {
  const [stats, topCars] = await Promise.all([
    getTournamentStats(),
    getTopNominations(3),
  ]);

  const isEliminatorias = stats.phase === "eliminatorias";

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="bg-ink px-4 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-gold font-display text-sm tracking-[0.3em] mb-1">ARGENTINA · 2026</p>
          <h1 className="font-display text-6xl sm:text-7xl leading-none mb-2">
            <span className="text-cream">MUNDIAL</span>
            <br />
            <span className="text-crimson">DE CLAVOS</span>
          </h1>
          <p className="text-cream/60 text-sm mt-3 leading-relaxed">
            El torneo definitivo del auto más clavo de la historia.
            Clasificá los peores, votá en cada ronda, y coroná al Gran Campeón.
          </p>
          <div className="mt-6">
            <PhaseBar phase={stats.phase as TournamentPhase} />
          </div>
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

      {/* Top 3 teaser — solo durante clasificación */}
      {isEliminatorias && topCars.length > 0 && (
        <section className="px-4 pb-8 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-crimson" />
            <h2 className="font-display text-xl text-ink tracking-wide">LOS QUE VAN ARRIBA</h2>
            <span className="text-xs text-muted ml-auto">y el resto es sorpresa...</span>
          </div>
          <div className="space-y-2">
            {topCars.map((car, i) => (
              <div key={car.car_name} className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3">
                <span className={`font-display text-2xl w-7 text-center shrink-0 ${
                  i === 0 ? "text-gold" : i === 1 ? "text-muted" : "text-crimson/60"
                }`}>{i + 1}</span>
                <span className="flex-1 text-sm text-ink font-medium min-w-0 truncate">{car.car_name}</span>
                <span className="text-xs text-muted shrink-0 bg-surface px-2 py-1 rounded-lg">
                  {car.total_nominations} {car.total_nominations === 1 ? "voto" : "votos"}
                </span>
              </div>
            ))}
            <p className="text-center text-xs text-muted pt-1">
              El ranking completo se revela cuando cierre la clasificación.
            </p>
          </div>
        </section>
      )}

      {/* Full ranking post-clasificación */}
      {!isEliminatorias && topCars.length > 0 && (
        <section className="px-4 pb-8 max-w-lg mx-auto w-full">
          <h2 className="font-display text-2xl text-ink mb-4 tracking-wide">CLASIFICADOS AL MUNDIAL</h2>
          <div className="space-y-2">
            {topCars.map((car, i) => (
              <div key={car.car_name} className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3">
                <span className={`font-display text-xl w-7 text-center shrink-0 ${
                  i === 0 ? "text-gold" : i === 1 ? "text-muted" : "text-crimson/60"
                }`}>{i + 1}</span>
                <span className="flex-1 text-sm text-ink font-medium min-w-0 truncate">{car.car_name}</span>
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
