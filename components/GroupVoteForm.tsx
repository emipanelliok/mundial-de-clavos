"use client";

import { useState } from "react";
import { Send, CheckCircle, Check } from "lucide-react";
import { submitGroupVote, type VotingGroup } from "@/app/actions";

export default function GroupVoteForm({ groups }: { groups: VotingGroup[] }) {
  const [handle, setHandle] = useState("");
  // picks: car_id -> group_letter
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const totalPicks = Object.keys(picks).length;
  const picksInGroup = (letter: string) => Object.values(picks).filter((g) => g === letter).length;

  const toggle = (carId: string, letter: string) => {
    setPicks((prev) => {
      const next = { ...prev };
      if (next[carId]) {
        delete next[carId];
      } else {
        if (picksInGroup(letter) >= 2) return prev; // máximo 2 por grupo
        next[carId] = letter;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPicks === 0) return;
    setLoading(true);
    setResult(null);
    setResult(await submitGroupVote(handle, Object.keys(picks)));
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
            "Ya voté la fase de grupos del Mundial de Autos Clavo 2026 🔩🏆\n\n¿Quién pasa a octavos? Votá vos acá 👇"
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
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={15}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          Elegí hasta 2 por grupo · los 2 más votados pasan a octavos
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groups.map((group) => {
            const inGroup = picksInGroup(group.letter);
            return (
              <div key={group.letter} className="bg-white rounded-2xl border-2 border-border overflow-hidden">
                <div className="bg-ink px-4 py-2 flex items-center justify-between">
                  <span className="font-display text-cream text-xl tracking-wider">GRUPO {group.letter}</span>
                  <span className={`text-xs font-medium ${inGroup === 2 ? "text-rust" : "text-cream/40"}`}>{inGroup}/2</span>
                </div>
                <div className="divide-y divide-border">
                  {group.cars.map((car) => {
                    const selected = !!picks[car.id];
                    const blocked = !selected && inGroup >= 2;
                    return (
                      <button
                        key={car.id}
                        type="button"
                        onClick={() => toggle(car.id, group.letter)}
                        disabled={blocked}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          selected ? "bg-rust/10" : blocked ? "opacity-40 cursor-not-allowed" : "hover:bg-surface"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? "bg-rust border-rust" : "border-border"
                          }`}
                        >
                          {selected && <Check size={13} className="text-white" />}
                        </span>
                        <span className="flex-1 text-sm text-ink font-medium truncate">{car.car_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
