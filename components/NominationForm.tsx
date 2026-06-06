"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Send, CheckCircle, Check, X, Loader } from "lucide-react";
import CarSearch from "./CarSearch";
import { submitNomination, checkTwitterHandle } from "@/app/actions";

type HandleStatus = "idle" | "checking" | "valid" | "invalid" | "unknown";

export default function NominationForm() {
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const [cars, setCars] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    { success: boolean; message?: string; error?: string } | null
  >(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirmedCars = cars.filter(Boolean);
  const canAddMore = cars.length < 5;

  // Debounced Twitter validation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!handle || handle.length < 1) {
      setHandleStatus("idle");
      return;
    }
    // Quick format check first
    if (!/^[a-z0-9_]{1,15}$/.test(handle)) {
      setHandleStatus("invalid");
      return;
    }
    setHandleStatus("checking");
    debounceRef.current = setTimeout(async () => {
      const status = await checkTwitterHandle(handle);
      setHandleStatus(status);
    }, 800);
  }, [handle]);

  const handleCarChange = (index: number, value: string) => {
    setCars((prev) => { const next = [...prev]; next[index] = value; return next; });
  };
  const handleRemoveCar = (index: number) => {
    setCars((prev) => prev.filter((_, i) => i !== index));
  };
  const handleAddCar = () => {
    if (cars.length < 5) setCars((prev) => [...prev, ""]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleStatus === "invalid") return;
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
          <h2 className="font-display text-3xl text-ink mb-2">¡CLASIFICADO AL MUNDIAL!</h2>
          <p className="text-muted text-sm">{result.message}</p>
        </div>
        <div className="w-full bg-surface rounded-2xl p-4 space-y-2">
          <p className="text-xs text-muted font-medium uppercase tracking-wider mb-3">Tus clasificados</p>
          {confirmedCars.map((car, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <span className="font-display text-xl text-rust">{i + 1}</span>
              <span className="text-ink text-sm font-medium">{car}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">Los 32 más nominados clasifican al Mundial.</p>
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
        <div className={`flex items-center gap-2 bg-white border-2 rounded-xl px-4 py-3 transition-colors ${
          handleStatus === "valid"
            ? "border-green-400"
            : handleStatus === "invalid"
            ? "border-crimson"
            : "border-border focus-within:border-rust/50"
        }`}>
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
          <div className="shrink-0 w-5 flex items-center justify-center">
            {handleStatus === "checking" && (
              <Loader size={14} className="text-muted animate-spin" />
            )}
            {handleStatus === "valid" && (
              <Check size={14} className="text-green-500" />
            )}
            {handleStatus === "invalid" && (
              <X size={14} className="text-crimson" />
            )}
          </div>
        </div>
        {handleStatus === "invalid" && handle.length > 0 && (
          <p className="text-xs text-crimson px-1">
            {!/^[a-z0-9_]{1,15}$/.test(handle)
              ? "Solo letras, números y _ · máx. 15 caracteres."
              : "Este usuario no existe en X/Twitter."}
          </p>
        )}
        {handleStatus === "unknown" && (
          <p className="text-xs text-muted px-1">No pudimos verificar el usuario, pero podés continuar.</p>
        )}
      </div>

      {/* Cars */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Tus clasificados ({confirmedCars.length}/5)
          </label>
          <span className="text-xs text-muted">Hasta 5 autos</span>
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
        disabled={loading || !handle || handleStatus === "invalid" || confirmedCars.length === 0}
        className="w-full flex items-center justify-center gap-3 bg-rust text-white font-display text-2xl py-4 rounded-2xl tracking-wider hover:bg-rust-dark active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rust/20"
      >
        {loading ? (
          <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <><Send size={18} />CLASIFICAR AL MUNDIAL</>
        )}
      </button>

      <p className="text-center text-xs text-muted">
        Un voto por persona. No se puede clasificar dos veces.
      </p>
    </form>
  );
}
