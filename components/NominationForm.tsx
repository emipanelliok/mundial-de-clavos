"use client";

import { useState } from "react";
import { Plus, Send, CheckCircle } from "lucide-react";
import CarSearch from "./CarSearch";
import { submitNomination } from "@/app/actions";

export default function NominationForm() {
  const [handle, setHandle] = useState("");
  const [cars, setCars] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    { success: boolean; message?: string; error?: string } | null
  >(null);

  const confirmedCars = cars.filter(Boolean);
  const canAddMore = cars.length < 5;

  const handleCarChange = (index: number, value: string) => {
    setCars((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveCar = (index: number) => {
    setCars((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCar = () => {
    if (cars.length < 5) {
      setCars((prev) => [...prev, ""]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmedCars.length === 0) return;
    setLoading(true);
    setResult(null);
    const res = await submitNomination(handle, confirmedCars);
    setResult(res);
    setLoading(false);
  };

  if (result?.success) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="w-20 h-20 rounded-full bg-rust/10 flex items-center justify-center">
          <CheckCircle className="text-rust" size={40} />
        </div>
        <div>
          <h2 className="font-display text-3xl text-ink mb-2">
            ¡NOMINACIÓN REGISTRADA!
          </h2>
          <p className="text-muted text-sm">{result.message}</p>
        </div>
        <div className="w-full bg-surface rounded-2xl p-4 space-y-2">
          <p className="text-xs text-muted font-medium uppercase tracking-wider mb-3">
            Tus nominados
          </p>
          {confirmedCars.map((car, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3"
            >
              <span className="font-display text-xl text-rust">{i + 1}</span>
              <span className="text-ink text-sm font-medium">{car}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">
          Los 32 más nominados clasifican al Mundial.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Twitter handle */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted uppercase tracking-wider">
          Tu usuario de Twitter / X
        </label>
        <div className="flex items-center gap-2 bg-white border-2 border-border rounded-xl px-4 py-3 focus-within:border-rust/50 transition-colors">
          <span className="text-muted font-medium">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) =>
              setHandle(e.target.value.replace(/[@\s]/g, "").toLowerCase())
            }
            placeholder="tuusuario"
            className="flex-1 bg-transparent text-ink text-sm outline-none placeholder:text-muted"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Cars */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Tus nominados ({confirmedCars.length}/5)
          </label>
          <span className="text-xs text-muted">Podés nominar hasta 5</span>
        </div>

        <div className="space-y-2">
          {cars.map((car, i) => (
            <CarSearch
              key={i}
              index={i}
              value={car}
              onChange={(v) => handleCarChange(i, v)}
              onRemove={() => handleRemoveCar(i)}
              existingCars={cars.filter((c, idx) => idx !== i && !!c)}
              canRemove={cars.length > 1}
            />
          ))}
        </div>

        {canAddMore && (
          <button
            type="button"
            onClick={handleAddCar}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted text-sm hover:border-rust/40 hover:text-rust transition-colors"
          >
            <Plus size={16} />
            Agregar otro auto
          </button>
        )}
      </div>

      {result?.error && (
        <div className="bg-crimson/10 border border-crimson/20 rounded-xl px-4 py-3 text-crimson text-sm">
          {result.error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !handle || confirmedCars.length === 0}
        className="w-full flex items-center justify-center gap-3 bg-rust text-white font-display text-2xl py-4 rounded-2xl tracking-wider hover:bg-rust-dark active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rust/20"
      >
        {loading ? (
          <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Send size={18} />
            NOMINAR
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted">
        Un voto por usuario. No se puede votar dos veces.
      </p>
    </form>
  );
}
