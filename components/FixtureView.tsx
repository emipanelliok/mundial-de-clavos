import type { TournamentCar, TournamentPhase } from "@/lib/db";

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

interface GroupData {
  letter: string;
  cars: (TournamentCar | null)[];
}

function buildGroups(
  cars: TournamentCar[],
  maxQualifiers: number
): GroupData[] {
  const groupCount = maxQualifiers <= 16 ? 4 : maxQualifiers <= 24 ? 6 : 8;
  const letters = GROUP_LETTERS.slice(0, groupCount);

  return letters.map((letter) => {
    const groupCars = cars.filter((c) => c.group_letter === letter);
    const slots = Array.from({ length: 4 }, (_, i) => groupCars[i] ?? null);
    return { letter, cars: slots };
  });
}

function GroupCard({ group, phase }: { group: GroupData; phase: TournamentPhase }) {
  const isEmpty = group.cars.every((c) => c === null);

  return (
    <div className="bg-white rounded-2xl border-2 border-border overflow-hidden">
      <div className="bg-ink px-4 py-2.5 flex items-center justify-between">
        <span className="font-display text-white text-2xl tracking-wider">
          GRUPO {group.letter}
        </span>
        {isEmpty && (
          <span className="text-xs text-white/40 font-medium uppercase tracking-wider">
            Clasificando...
          </span>
        )}
      </div>
      <div className="divide-y divide-border">
        {group.cars.map((car, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 min-h-[52px]"
          >
            <span className="font-display text-xl text-muted w-5 text-center shrink-0">
              {i + 1}
            </span>
            {car ? (
              <span className="text-sm text-ink font-medium">{car.car_name}</span>
            ) : (
              <span className="text-xs text-muted/40 italic">
                {phase === "eliminatorias" ? "— vacante —" : "TBD"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface FixtureViewProps {
  phase: TournamentPhase;
  tournamentCars: TournamentCar[];
  maxQualifiers: number;
}

export default function FixtureView({
  phase,
  tournamentCars,
  maxQualifiers,
}: FixtureViewProps) {
  const groups = buildGroups(tournamentCars, maxQualifiers);

  return (
    <div className="space-y-6">
      {phase === "eliminatorias" && (
        <div className="bg-gold/10 border border-gold/30 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm text-ink font-medium">
            El fixture se completa cuando cierren las nominaciones.
          </p>
          <p className="text-xs text-muted mt-1">
            Los {maxQualifiers} autos más nominados clasifican al mundial.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups.map((group) => (
          <GroupCard key={group.letter} group={group} phase={phase} />
        ))}
      </div>
    </div>
  );
}
