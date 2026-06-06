import Link from "next/link";
import { getTournamentStats, getTopNominations } from "./actions";
import PhaseBar from "@/components/PhaseBar";
import { Trophy, Users, Car, ChevronRight } from "lucide-react";
import type { TournamentPhase } from "@/lib/db";

export const revalidate = 30;

export default async function HomePage() {
  const [stats, topCars] = await Promise.all([
    getTournamentStats(),
    getTopNominations(10),
  ]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="bg-ink text-white px-4 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-gold font-display text-sm tracking-[0.3em] mb-1">
            ARGENTINA · 2026
          </p>
          <h1 className="font-display text-6xl sm:text-7xl leading-none mb-2">
            MUNDIAL
            <br />
            <span className="text-rust">DE CLAVOS</span>
          </h1>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            El torneo definitivo del auto más clavo de la historia.
            Nominá los peores, votá en cada ronda, y coroná al Gran Campeón.
          </p>

          <div className="mt-6">
            <PhaseBar phase={stats.phase as TournamentPhase} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-surface border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users size={16} className="text-rust shrink-0" />
            <span className="text-ink font-medium">{stats.totalVoters.toLocaleString()}</span>
            <span className="text-muted">votantes</span>
          </div>
          <div className="w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Car size={16} className="text-rust shrink-0" />
            <span className="text-ink font-medium">{stats.totalNominations.toLocaleString()}</span>
            <span className="text-muted">nominaciones</span>
          </div>
          <div className="w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Trophy size={16} className="text-gold shrink-0" />
            <span className="text-ink font-medium">{stats.maxQualifiers}</span>
            <span className="text-muted">clasifican</span>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="px-4 py-6 max-w-lg mx-auto w-full space-y-3">
        {stats.nominationsOpen && (
          <Link
            href="/nominaciones"
            className="flex items-center justify-between w-full bg-rust text-white rounded-2xl px-5 py-4 shadow-lg shadow-rust/20 hover:bg-rust-dark active:scale-[0.98] transition-all"
          >
            <div>
              <p className="font-display text-2xl tracking-wide">NOMINAR AHORA</p>
              <p className="text-white/70 text-xs mt-0.5">
                Elegí los autos más clavos · hasta 5 votos
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0" />
          </Link>
        )}

        <Link
          href="/fixture"
          className="flex items-center justify-between w-full bg-white border-2 border-border rounded-2xl px-5 py-4 hover:border-rust/30 active:scale-[0.98] transition-all"
        >
          <div>
            <p className="font-display text-2xl text-ink tracking-wide">VER FIXTURE</p>
            <p className="text-muted text-xs mt-0.5">
              Los grupos y el bracket del Mundial
            </p>
          </div>
          <ChevronRight size={20} className="text-muted shrink-0" />
        </Link>
      </section>

      {/* Top Nominations */}
      {topCars.length > 0 && (
        <section className="px-4 pb-8 max-w-lg mx-auto w-full">
          <h2 className="font-display text-2xl text-ink mb-4 tracking-wide">
            RANKING ACTUAL
          </h2>
          <div className="space-y-2">
            {topCars.map((car, i) => (
              <div
                key={car.car_name}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-border"
              >
                <span
                  className={`font-display text-xl w-7 text-center shrink-0 ${
                    i === 0
                      ? "text-gold"
                      : i === 1
                      ? "text-muted"
                      : i === 2
                      ? "text-rust/70"
                      : "text-muted/50"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-ink font-medium min-w-0 truncate">
                  {car.car_name}
                </span>
                <span className="text-xs text-muted shrink-0">
                  {car.total_nominations}{" "}
                  {car.total_nominations === 1 ? "voto" : "votos"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-auto px-4 py-6 text-center">
        <p className="text-xs text-muted">
          Mundial de Clavos 2026 · por{" "}
          <a
            href="https://x.com/emipanelli"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rust underline"
          >
            @emipanelli
          </a>
        </p>
      </footer>
    </main>
  );
}
