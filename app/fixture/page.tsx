import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { sql, IS_CONFIGURED } from "@/lib/db";
import FixtureView from "@/components/FixtureView";
import Bracket from "@/components/Bracket";
import PhaseBar from "@/components/PhaseBar";
import { getBracketMatches } from "../actions";
import type { TournamentPhase, TournamentCar } from "@/lib/db";

export const revalidate = 30;

async function getFixtureData() {
  if (!IS_CONFIGURED || !sql) return { phase: "eliminatorias" as TournamentPhase, maxQualifiers: 32, cars: [] as TournamentCar[] };
  try {
    const [[config], cars] = await Promise.all([
      sql`SELECT phase, max_qualifiers FROM tournament_config WHERE id = 1`,
      sql`SELECT * FROM tournament_cars ORDER BY seed ASC NULLS LAST`,
    ]);
    return {
      phase: (config?.phase ?? "eliminatorias") as TournamentPhase,
      maxQualifiers: config?.max_qualifiers ?? 32,
      cars: (cars ?? []) as TournamentCar[],
    };
  } catch {
    return { phase: "eliminatorias" as TournamentPhase, maxQualifiers: 32, cars: [] as TournamentCar[] };
  }
}

export default async function FixturePage() {
  const [{ phase, maxQualifiers, cars }, bracketMatches] = await Promise.all([
    getFixtureData(),
    getBracketMatches(),
  ]);
  return (
    <main className="min-h-screen flex flex-col">
      <div className="bg-ink px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-1 text-cream/50 text-sm hover:text-cream transition-colors mb-4">
            <ChevronLeft size={16} />Inicio
          </Link>
          <h1 className="font-display text-4xl text-cream leading-none mb-4">EL FIXTURE</h1>
          <PhaseBar phase={phase} />
        </div>
      </div>
      <div className="flex-1 py-6 space-y-12">
        {/* LAS LLAVES — protagonista, ancho completo */}
        <div>
          <div className="px-4 max-w-6xl mx-auto mb-4">
            <h2 className="font-display text-4xl text-ink tracking-wide leading-none">LAS LLAVES</h2>
            <p className="text-xs text-muted mt-1">
              El camino al título. Se completa a medida que avanzan las rondas.
              <span className="sm:hidden"> Deslizá para ver todo el cuadro →</span>
            </p>
          </div>
          <Bracket matches={bracketMatches} />
        </div>

        {/* FASE DE GRUPOS — secundario, más chico */}
        <div className="px-4 max-w-5xl mx-auto">
          <h2 className="font-display text-xl text-muted mb-3 tracking-wide">FASE DE GRUPOS</h2>
          <FixtureView phase={phase} tournamentCars={cars} maxQualifiers={maxQualifiers} compact />
        </div>
      </div>
      <footer className="px-4 py-6 text-center border-t border-border">
        <p className="text-xs text-muted">
          Mundial de Clavos 2026 · por{" "}
          <a href="https://x.com/emipanelli" target="_blank" rel="noopener noreferrer" className="text-rust font-medium">@emipanelli</a>
        </p>
      </footer>
    </main>
  );
}
