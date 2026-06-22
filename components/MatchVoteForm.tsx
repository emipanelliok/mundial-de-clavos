"use client";

import { useState } from "react";
import { Send, CheckCircle, Check } from "lucide-react";
import { submitMatchVotes, type MatchCard } from "@/app/actions";

function CarSide({ name, img, selected, onClick }: {
  name: string | null; img: string | null; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
        selected ? "border-rust bg-rust/10" : "border-border bg-white hover:border-rust/40"
      }`}
    >
      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface flex items-center justify-center">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={name ?? ""} className="w-full h-full object-cover" />
        ) : (
          <span className="text-muted/40 text-xs">sin foto</span>
        )}
      </div>
      <span className="text-sm text-ink font-medium text-center leading-tight">{name}</span>
      {selected && (
        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rust flex items-center justify-center">
          <Check size={14} className="text-white" />
        </span>
      )}
    </button>
  );
}

const PHASE_TITLE: Record<string, string> = {
  octavos: "OCTAVOS DE FINAL",
  cuartos: "CUARTOS DE FINAL",
  semifinal: "SEMIFINAL",
  final: "LA GRAN FINAL",
};

export default function MatchVoteForm({ matches }: { matches: MatchCard[] }) {
  const [handle, setHandle] = useState("");
  const [picks, setPicks] = useState<Record<string, string>>({}); // matchId -> carId
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const totalPicks = Object.keys(picks).length;
  const phaseTitle = PHASE_TITLE[matches[0]?.phase] ?? "ELIMINATORIAS";

  const pick = (matchId: string, carId: string) =>
    setPicks((prev) => ({ ...prev, [matchId]: prev[matchId] === carId ? "" : carId }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = Object.entries(picks).filter(([, c]) => c).map(([matchId, carId]) => ({ matchId, carId }));
    if (valid.length === 0) return;
    setLoading(true);
    setResult(null);
    setResult(await submitMatchVotes(handle, valid));
    setLoading(false);
  };

  if (result?.success) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="w-20 h-20 rounded-full bg-rust/10 border-2 border-rust/20 flex items-center justify-center">
          <CheckCircle className="text-rust" size={40} />
        </div>
        <div>
          <h2 className="font-display text-3xl text-ink mb-2">¡VOTO REGISTRADO!</h2>
          <p className="text-muted text-sm">{result.message}</p>
        </div>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `Ya voté ${phaseTitle.toLowerCase()} del Mundial de Autos Clavo 2026 🔩🏆\n\n¿Quién avanza? Votá vos acá 👇`
          )}&url=${encodeURIComponent("https://mundial-de-clavos.vercel.app")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm flex items-center justify-center gap-3 bg-ink text-white font-display text-2xl py-4 rounded-2xl tracking-wider hover:bg-ink/90 active:scale-[0.98] transition-all"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          COMPARTÍ EN X
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Tu usuario de Twitter / X</label>
        <div className="flex items-center gap-2 bg-white border-2 border-border rounded-xl px-4 py-3 focus-within:border-rust/40 transition-colors">
          <span className="text-muted font-medium shrink-0">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/[@\s]/g, "").toLowerCase())}
            placeholder="tuusuario"
            className="flex-1 bg-transparent text-ink text-sm outline-none placeholder:text-muted"
            required autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={15}
          />
        </div>
      </div>

      <p className="text-xs font-semibold text-muted uppercase tracking-wider">
        Elegí quién avanza en cada cruce
      </p>

      <div className="space-y-4">
        {matches.map((m, idx) => (
          <div key={m.id} className="bg-surface rounded-2xl p-3 border border-border">
            <p className="text-[10px] text-muted font-semibold uppercase tracking-widest mb-2 text-center">
              Partido {idx + 1}
            </p>
            <div className="flex items-stretch gap-2">
              <CarSide name={m.car1_name} img={m.car1_img} selected={picks[m.id] === m.car1_id} onClick={() => m.car1_id && pick(m.id, m.car1_id)} />
              <div className="flex items-center font-display text-xl text-muted shrink-0">VS</div>
              <CarSide name={m.car2_name} img={m.car2_img} selected={picks[m.id] === m.car2_id} onClick={() => m.car2_id && pick(m.id, m.car2_id)} />
            </div>
          </div>
        ))}
      </div>

      {result?.error && (
        <div className="bg-crimson/8 border border-crimson/20 rounded-xl px-4 py-3 text-crimson text-sm">{result.error}</div>
      )}

      <button
        type="submit"
        disabled={loading || !handle || totalPicks === 0}
        className="w-full flex items-center justify-center gap-3 bg-rust text-white font-display text-2xl py-4 rounded-2xl tracking-wider hover:bg-rust-dark active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-rust/20"
      >
        {loading
          ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><Send size={18} />VOTAR ({totalPicks})</>
        }
      </button>

      <p className="text-center text-xs text-muted">Un voto por persona. No se puede votar dos veces.</p>
    </form>
  );
}
