import type { TournamentCar, TournamentPhase } from "@/lib/db";

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function buildGroups(cars: TournamentCar[], maxQualifiers: number) {
  const groupCount = maxQualifiers <= 16 ? 4 : maxQualifiers <= 24 ? 6 : 8;
  return GROUP_LETTERS.slice(0, groupCount).map((letter) => {
    const groupCars = cars.filter((c) => c.group_letter === letter);
    return { letter, cars: Array.from({ length: 4 }, (_, i) => groupCars[i] ?? null) };
  });
}

function GroupCard({ group, phase }: { group: { letter: string; cars: (TournamentCar | null)[] }; phase: TournamentPhase }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-border overflow-hidden shadow-sm">
      <div className="bg-ink px-4 py-2.5 flex items-center justify-between">
        <span className="font-display text-cream text-2xl tracking-wider">GRUPO {group.letter}</span>
        {group.cars.every((c) => !c) && (
          <span className="text-xs text-cream/40 font-medium uppercase tracking-wider">Clasificando...</span>
        )}
      </div>
      <div className="divide-y divide-border">
        {group.cars.map((car, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
            <span className="font-display text-xl text-muted w-5 text-center shrink-0">{i + 1}</span>
            {car
              ? <span className="text-sm text-ink font-medium">{car.car_name}</span>
              : <span className="text-xs text-muted/40 italic">{phase === "eliminatorias" ? "— vacante —" : "TBD"}</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FixtureView({ phase, tournamentCars, maxQualifiers }: {
  phase: TournamentPhase; tournamentCars: TournamentCar[]; maxQualifiers: number;
}) {
  const groups = buildGroups(tournamentCars, maxQualifiers);
  return (
    <div className="space-y-6">
      {phase === "eliminatorias" && (
        <div className="bg-gold/10 border border-gold/25 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm text-ink font-medium">El fixture se completa cuando cierren las clasificaciones.</p>
          <p className="text-xs text-muted mt-1">Los {maxQualifiers} autos más votados clasifican al mundial.</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => <GroupCard key={group.letter} group={group} phase={phase} />)}
      </div>
    </div>
  );
}
