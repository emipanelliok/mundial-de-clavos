import type { TournamentPhase } from "@/lib/db";

const PHASES: { key: TournamentPhase; label: string; short: string }[] = [
  { key: "eliminatorias", label: "Clasificación", short: "CLASIF." },
  { key: "grupos", label: "Fase de Grupos", short: "GRUPOS" },
  { key: "octavos", label: "Octavos", short: "R16" },
  { key: "cuartos", label: "Cuartos", short: "QF" },
  { key: "semifinal", label: "Semifinal", short: "SF" },
  { key: "final", label: "Final", short: "FINAL" },
];

export default function PhaseBar({ phase }: { phase: TournamentPhase }) {
  const currentIndex = PHASES.findIndex((p) => p.key === phase);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
      {PHASES.map((p, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={p.key} className="flex items-center gap-1 shrink-0">
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isCurrent ? "bg-rust text-ink" :
              isPast ? "bg-border/50 text-muted/50 line-through" :
              "bg-surface text-muted/40 border border-border/50"
            }`}>
              <span className="hidden sm:inline">{p.label}</span>
              <span className="sm:hidden">{p.short}</span>
            </div>
            {i < PHASES.length - 1 && <span className="text-border text-xs">›</span>}
          </div>
        );
      })}
    </div>
  );
}
