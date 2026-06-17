import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTournamentStats, getGroupsForVoting } from "../actions";
import GroupVoteForm from "@/components/GroupVoteForm";

export const revalidate = 0;

export default async function VotarPage() {
  const [stats, groups] = await Promise.all([getTournamentStats(), getGroupsForVoting()]);

  // Solo disponible en fase de grupos
  if (stats.phase !== "grupos" || groups.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-sm w-full space-y-4">
          <h1 className="font-display text-4xl text-ink">
            {stats.phase === "eliminatorias" ? "TODAVÍA NO" : "VOTACIÓN CERRADA"}
          </h1>
          <p className="text-muted text-sm">
            {stats.phase === "eliminatorias"
              ? "La fase de grupos todavía no arrancó. Volvé cuando cierre la clasificación."
              : "Esta ronda de votación no está abierta en este momento."}
          </p>
          <Link href="/" className="inline-block bg-rust text-white font-display text-xl px-6 py-3 rounded-2xl tracking-wide">
            VOLVER AL INICIO
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="bg-ink px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-1 text-cream/50 text-sm hover:text-cream transition-colors mb-4">
            <ChevronLeft size={16} />Inicio
          </Link>
          <h1 className="font-display text-4xl text-cream leading-none">
            FASE DE <span className="text-crimson">GRUPOS</span>
          </h1>
          <p className="text-cream/50 text-xs mt-2">Elegí los 2 autos de cada grupo que merecen pasar a octavos.</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <GroupVoteForm groups={groups} />
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
