"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Send, CheckCircle, Check, X, Loader } from "lucide-react";
import CarSearch from "./CarSearch";
import { submitNomination, checkTwitterHandle } from "@/app/actions";

type HandleStatus = "idle" | "checking" | "valid" | "invalid" | "unknown";

export default function NominationForm() {
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const [email, setEmail] = useState("");
  const [cars, setCars] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirmedCars = cars.filter(Boolean);
  const canAddMore = cars.length < 5;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!handle) { setHandleStatus("idle"); return; }
    if (!/^[a-z0-9_]{1,15}$/.test(handle)) { setHandleStatus("invalid"); return; }
    setHandleStatus("checking");
    debounceRef.current = setTimeout(async () => {
      setHandleStatus(await checkTwitterHandle(handle));
    }, 800);
  }, [handle]);

  const handleCarChange = (i: number, v: string) => setCars((p) => { const n = [...p]; n[i] = v; return n; });
  const handleRemoveCar = (i: number) => setCars((p) => p.filter((_, idx) => idx !== i));
  const handleAddCar = () => { if (cars.length < 5) setCars((p) => [...p, ""]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleStatus === "invalid" || confirmedCars.length === 0) return;
    setLoading(true); setResult(null);
    setResult(await submitNomination(handle, confirmedCars, email));
    setLoading(false);
  };

  if (result?.success) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="w-20 h-20 rounded-full bg-rust/10 border-2 border-rust/20 flex items-center justify-center">
          <CheckCircle className="text-rust" size={40} />
        </div>
        <div>
          <h2 className="font-display text-3xl text-ink mb-2">¡CLASIFICADO AL MUNDIAL!</h2>
          <p className="text-muted text-sm">{result.message}</p>
        </div>
        <div className="w-full bg-surface rounded-2xl p-4 space-y-2 border border-border">
          <p className="text-xs text-muted font-medium uppercase tracking-wider mb-3">Tus clasificados</p>
          {confirmedCars.map((car, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3">
              <span className="font-display text-xl text-rust">{i + 1}</span>
              <span className="text-ink text-sm font-medium">{car}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">El ranking se revela cuando cierre la clasificación.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Tu usuario de Twitter / X</label>
        <div className={`flex items-center gap-2 bg-white border-2 rounded-xl px-4 py-3 transition-colors ${
          handleStatus === "valid" ? "border-rust/50" :
          handleStatus === "invalid" ? "border-crimson/50" :
          "border-border focus-within:border-rust/40"
        }`}>
          <span className="text-muted font-medium shrink-0">@</span>
          <input
            type="text" value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/[@\s]/g, "").toLowerCase())}
            placeholder="tuusuario"
            className="flex-1 bg-transparent text-ink text-sm outline-none placeholder:text-muted"
            required autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={15}
          />
          <div className="shrink-0 w-5 flex items-center justify-center">
            {handleStatus === "checking" && <Loader size={14} className="text-muted animate-spin" />}
            {handleStatus === "valid" && <Check size={14} className="text-rust" />}
            {handleStatus === "invalid" && <X size={14} className="text-crimson" />}
          </div>
        </div>
        {handleStatus === "invalid" && handle.length > 0 && (
          <p className="text-xs text-crimson px-1">
            {!/^[a-z0-9_]{1,15}$/.test(handle)
              ? "Solo letras, números y _ · máx. 15 caracteres."
              : "Este usuario no existe en X/Twitter."}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            Tus clasificados ({confirmedCars.length}/5)
          </label>
          <span className="text-xs text-muted">Hasta 5 autos</span>
        </div>

        <div className="bg-surface border border-border rounded-xl px-3 py-2.5 text-xs text-muted leading-relaxed">
          Hay una lista de autos cargados — buscá por marca o modelo. Si el tuyo no está,
          podés agregarlo vos, pero <span className="text-ink font-medium">escribí marca y modelo completos</span>
          {" "}(ej: <span className="text-ink">Rover 75</span>, no solo &quot;Rover&quot;).
        </div>

        <div className="space-y-2">
          {cars.map((car, i) => (
            <CarSearch key={i} index={i} value={car}
              onChange={(v) => handleCarChange(i, v)}
              onRemove={() => handleRemoveCar(i)}
              existingCars={cars.filter((c, idx) => idx !== i && !!c)}
              canRemove={cars.length > 1}
            />
          ))}
        </div>
        {canAddMore && (
          <button type="button" onClick={handleAddCar}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted text-sm hover:border-rust/40 hover:text-rust transition-colors"
          >
            <Plus size={16} />Agregar otro auto
          </button>
        )}
      </div>

      {/* Email opcional */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
          Email <span className="text-muted/60 normal-case font-normal tracking-normal">— opcional</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tuemail@ejemplo.com"
          className="w-full bg-white border-2 border-border rounded-xl px-4 py-3 text-ink text-sm outline-none placeholder:text-muted focus:border-rust/40 transition-colors"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted px-1">Te avisamos cuando tus clavos avancen de ronda. No spam.</p>
      </div>

      {result?.error && (
        <div className="bg-crimson/8 border border-crimson/20 rounded-xl px-4 py-3 text-crimson text-sm">{result.error}</div>
      )}

      <button type="submit"
        disabled={loading || !handle || handleStatus === "invalid" || confirmedCars.length === 0}
        className="w-full flex items-center justify-center gap-3 bg-rust text-white font-display text-2xl py-4 rounded-2xl tracking-wider hover:bg-rust-dark active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-rust/20"
      >
        {loading
          ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><Send size={18} />CARGAR MIS CANDIDATOS</>
        }
      </button>

      <p className="text-center text-xs text-muted">Un voto por persona · No se puede clasificar dos veces.</p>
    </form>
  );
}
