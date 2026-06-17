import type { TournamentCar } from "@/lib/db";

// Cruces estándar FIFA para 8 grupos (16 a octavos)
// Lado izquierdo del cuadro y lado derecho convergen en la final.
const LEFT_R16 = [
  { id: "o1", a: "1°A", b: "2°B" },
  { id: "o2", a: "1°C", b: "2°D" },
  { id: "o3", a: "1°E", b: "2°F" },
  { id: "o4", a: "1°G", b: "2°H" },
];
const RIGHT_R16 = [
  { id: "o5", a: "1°B", b: "2°A" },
  { id: "o6", a: "1°D", b: "2°C" },
  { id: "o7", a: "1°F", b: "2°E" },
  { id: "o8", a: "1°H", b: "2°G" },
];

type Slot = { label: string; car?: TournamentCar | null };

function MatchCard({ top, bottom, compact }: { top: Slot; bottom: Slot; compact?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border border-border overflow-hidden shadow-sm ${compact ? "w-32" : "w-40"} shrink-0`}>
      {[top, bottom].map((s, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-2.5 py-2 text-xs ${i === 0 ? "border-b border-border" : ""}`}
        >
          {s.car ? (
            <span className="text-ink font-medium truncate">{s.car.car_name}</span>
          ) : (
            <span className="text-muted/70 font-display text-sm tracking-wide">{s.label}</span>
          )}
        </div>
      ))}
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

export default function Bracket() {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch justify-center gap-3 md:gap-5 min-w-[900px] mx-auto">
        {/* Octavos izquierda */}
        <Column title="OCTAVOS">
          {LEFT_R16.map((m) => (
            <MatchCard key={m.id} top={{ label: m.a }} bottom={{ label: m.b }} compact />
          ))}
        </Column>

        {/* Cuartos izquierda */}
        <Column title="CUARTOS">
          <MatchCard top={{ label: "Gan. O1" }} bottom={{ label: "Gan. O2" }} compact />
          <MatchCard top={{ label: "Gan. O3" }} bottom={{ label: "Gan. O4" }} compact />
        </Column>

        {/* Semi izquierda */}
        <Column title="SEMI">
          <MatchCard top={{ label: "Gan. C1" }} bottom={{ label: "Gan. C2" }} compact />
        </Column>

        {/* Final / Trofeo */}
        <div className="flex flex-col items-center justify-center gap-3 px-2">
          <span className="font-display text-base text-gold tracking-widest">FINAL</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-16 h-auto object-contain" />
          <MatchCard top={{ label: "Finalista 1" }} bottom={{ label: "Finalista 2" }} />
          <span className="font-display text-xs text-muted tracking-widest text-center">
            🏆 GRAN<br />CAMPEÓN
          </span>
        </div>

        {/* Semi derecha */}
        <Column title="SEMI">
          <MatchCard top={{ label: "Gan. C3" }} bottom={{ label: "Gan. C4" }} compact />
        </Column>

        {/* Cuartos derecha */}
        <Column title="CUARTOS">
          <MatchCard top={{ label: "Gan. O5" }} bottom={{ label: "Gan. O6" }} compact />
          <MatchCard top={{ label: "Gan. O7" }} bottom={{ label: "Gan. O8" }} compact />
        </Column>

        {/* Octavos derecha */}
        <Column title="OCTAVOS">
          {RIGHT_R16.map((m) => (
            <MatchCard key={m.id} top={{ label: m.a }} bottom={{ label: m.b }} compact />
          ))}
        </Column>
      </div>
    </div>
  );
}
