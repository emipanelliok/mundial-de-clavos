import type { BracketMatch } from "@/app/actions";

// Slots del cuadro (phase, match_number, placeholders) — layout FIFA 8 grupos
const LEFT_R16 = [
  { num: 1, a: "1°A", b: "2°B" },
  { num: 2, a: "1°C", b: "2°D" },
  { num: 3, a: "1°E", b: "2°F" },
  { num: 4, a: "1°G", b: "2°H" },
];
const RIGHT_R16 = [
  { num: 5, a: "1°B", b: "2°A" },
  { num: 6, a: "1°D", b: "2°C" },
  { num: 7, a: "1°F", b: "2°E" },
  { num: 8, a: "1°H", b: "2°G" },
];

function MatchCard({ m, aLabel, bLabel, compact }: {
  m?: BracketMatch; aLabel: string; bLabel: string; compact?: boolean;
}) {
  const rows = [
    { name: m?.car1_name, img: m?.car1_img, votes: m?.car1_votes ?? 0, id: m?.car1_id, label: aLabel },
    { name: m?.car2_name, img: m?.car2_img, votes: m?.car2_votes ?? 0, id: m?.car2_id, label: bLabel },
  ];
  const decided = m && !m.is_active && m.winner_id;
  return (
    <div className={`bg-white rounded-lg border border-border overflow-hidden shadow-sm ${compact ? "w-36" : "w-44"} shrink-0`}>
      {rows.map((r, i) => {
        const isWinner = decided && r.id === m!.winner_id;
        const isLoser = decided && r.id !== m!.winner_id;
        return (
          <div
            key={i}
            className={`flex items-center gap-2 px-2 py-1.5 text-xs ${i === 0 ? "border-b border-border" : ""} ${
              isWinner ? "bg-rust/10" : isLoser ? "opacity-50" : ""
            }`}
          >
            {r.img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.img} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
            ) : (
              <span className="w-6 h-6 rounded bg-surface shrink-0" />
            )}
            {r.name ? (
              <span className={`flex-1 truncate ${isWinner ? "text-ink font-semibold" : "text-ink"}`}>{r.name}</span>
            ) : (
              <span className="flex-1 text-muted/60 font-display text-sm tracking-wide">{r.label}</span>
            )}
            {m && (m.car1_name || m.car2_name) && (
              <span className={`shrink-0 tabular-nums ${isWinner ? "text-rust font-bold" : "text-muted"}`}>{r.votes}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      <span className="font-display text-sm text-rust tracking-widest">{title}</span>
      <div className="flex flex-col justify-around flex-1 gap-3">{children}</div>
    </div>
  );
}

export default function Bracket({ matches = [] }: { matches?: BracketMatch[] }) {
  const get = (phase: string, num: number) => matches.find((m) => m.phase === phase && m.match_number === num);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch justify-center gap-3 md:gap-5 min-w-[1000px] mx-auto">
        {/* Octavos izquierda */}
        <Column title="OCTAVOS">
          {LEFT_R16.map((s) => <MatchCard key={s.num} m={get("octavos", s.num)} aLabel={s.a} bLabel={s.b} compact />)}
        </Column>

        {/* Cuartos izquierda */}
        <Column title="CUARTOS">
          <MatchCard m={get("cuartos", 1)} aLabel="Gan. P1" bLabel="Gan. P2" compact />
          <MatchCard m={get("cuartos", 2)} aLabel="Gan. P3" bLabel="Gan. P4" compact />
        </Column>

        {/* Semi izquierda */}
        <Column title="SEMI">
          <MatchCard m={get("semifinal", 1)} aLabel="Gan. C1" bLabel="Gan. C2" compact />
        </Column>

        {/* Final / Trofeo */}
        <div className="flex flex-col items-center justify-center gap-3 px-2">
          <span className="font-display text-base text-gold tracking-widest">FINAL</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-16 h-auto object-contain" />
          <MatchCard m={get("final", 1)} aLabel="Finalista 1" bLabel="Finalista 2" />
          <span className="font-display text-xs text-muted tracking-widest text-center">🏆 GRAN<br />CAMPEÓN</span>
        </div>

        {/* Semi derecha */}
        <Column title="SEMI">
          <MatchCard m={get("semifinal", 2)} aLabel="Gan. C3" bLabel="Gan. C4" compact />
        </Column>

        {/* Cuartos derecha */}
        <Column title="CUARTOS">
          <MatchCard m={get("cuartos", 3)} aLabel="Gan. P5" bLabel="Gan. P6" compact />
          <MatchCard m={get("cuartos", 4)} aLabel="Gan. P7" bLabel="Gan. P8" compact />
        </Column>

        {/* Octavos derecha */}
        <Column title="OCTAVOS">
          {RIGHT_R16.map((s) => <MatchCard key={s.num} m={get("octavos", s.num)} aLabel={s.a} bLabel={s.b} compact />)}
        </Column>
      </div>
    </div>
  );
}
