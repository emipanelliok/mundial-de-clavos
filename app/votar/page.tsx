import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTournamentStats, getGroupsForVoting, getActiveMatches } from "../actions";
import GroupVoteForm from "@/components/GroupVoteForm";
import MatchVoteForm from "@/components/MatchVoteForm";

export const revalidate = 0;

const KNOCKOUT = ["octavos", "cuartos", "semifinal", "final"];
const PHASE_TITLE: Record<string, { big: string; accent: string; sub: string }> = {
  grupos: { big: "FASE DE", accent: "GRUPOS", sub: "Elegí los 2 autos de cada grupo que merecen pasar a octavos." },
  octavos: { big: "OCTAVOS", accent: "DE FINAL", sub: "Mano a mano. Elegí quién avanza en cada cruce." },
  cuartos: { big: "CUARTOS", accent: "DE FINAL", sub: "Quedan 8. Elegí quién pasa a semis." },
  semifinal: { big: "SEMI", accent: "FINAL", sub: "Solo 4. ¿Quién llega a la final?" },
  final: { big: "LA GRAN", accent: "FINAL", sub: "Dos clavos. Un campeón. Votá al peor auto de la historia." },
};

export default async function VotarPage() {
  const stats = await getTournamentStats();
  const phase = stats.phase;

  const isGroups = phase === "grupos";
  const isKnockout = KNOCKOUT.includes(phase);

  if (!isGroups && !isKnockout) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-sm w-full space-y-4">
          <h1 className="font-display text-4xl text-ink">
            {phase === "eliminatorias" ? "TODAVÍA NO" : phase === "terminado" ? "MUNDIAL TERMINADO" : "VOTACIÓN CERRADA"}
          </h1>
          <p className="text-muted text-sm">
            {phase === "eliminatorias"
              ? "La votación todavía no arrancó. Volvé cuando cierre la clasificación."
              : phase === "terminado"
              ? "Ya tenemos al Gran Campeón. Mirá el fixture."
              : "Esta ronda no está abierta en este momento."}
          </p>
          <Link href={phase === "terminado" ? "/fixture" : "/"} className="inline-block bg-rust text-white font-display text-xl px-6 py-3 rounded-2xl tracking-wide">
            {phase === "terminado" ? "VER EL CAMPEÓN" : "VOLVER AL INICIO"}
          </Link>
        </div>
      </main>
    );
  }

  const [groups, matches] = await Promise.all([
    isGroups ? getGroupsForVoting() : Promise.resolve([]),
    isKnockout ? getActiveMatches() : Promise.resolve([]),
  ]);

  const t = PHASE_TITLE[phase] ?? PHASE_TITLE.grupos;
  const empty = (isGroups && groups.length === 0) || (isKnockout && matches.length === 0);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="bg-ink px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-1 text-cream/50 text-sm hover:text-cream transition-colors mb-4">
            <ChevronLeft size={16} />Inicio
          </Link>
          <h1 className="font-display text-4xl text-cream leading-none">
            {t.big} <span className="text-crimson">{t.accent}</span>
          </h1>
          <p className="text-cream/50 text-xs mt-2">{t.sub}</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {empty ? (
            <p className="text-muted text-sm text-center py-10">Todavía no hay partidos abiertos para esta ronda.</p>
          ) : isGroups ? (
            <GroupVoteForm groups={groups} />
          ) : (
            <MatchVoteForm matches={matches} />
          )}
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
