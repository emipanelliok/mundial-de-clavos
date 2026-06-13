"use client";

import { useState, useTransition } from "react";
import { LayoutDashboard, Car, Users, Trophy, Lock, Unlock, Trash2, Pencil, Check, X, Shuffle, RotateCcw, AlertTriangle } from "lucide-react";
import AdminControls from "./AdminControls";
import { deleteNomination, renameCar, buildTournament, reopenClassification } from "@/app/admin/actions";
import type { TournamentPhase } from "@/lib/db";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "autos",     label: "Autos",     icon: Car },
  { id: "votantes",  label: "Votantes",  icon: Users },
  { id: "fixture",   label: "Fixture",   icon: Trophy },
] as const;

type Tab = (typeof TABS)[number]["id"];

type GroupCar = { car_name: string; total_nominations: number; seed: number | null; group_letter: string | null; group_position: number | null };

interface AdminLayoutProps {
  config: { phase: TournamentPhase; maxQualifiers: number; nominationsOpen: boolean; phaseEndsAt: string | null };
  topCars: { car_name: string; total_nominations: number }[];
  recentNominations: { twitter_handle: string; email: string | null; created_at: string; cars: string[] }[];
  groupCars: GroupCar[];
  totalVoters: number;
  totalCars: number;
}

export default function AdminLayout({ config, topCars, recentNominations, groupCars, totalVoters, totalCars }: AdminLayoutProps) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [nominations, setNominations] = useState(recentNominations);

  const handleDelete = async (handle: string) => {
    await deleteNomination(handle);
    setNominations((prev) => prev.filter((n) => n.twitter_handle !== handle));
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-ink border-r border-white/10 pt-8 pb-6 px-3">
        <div className="mb-8 px-2">
          <p className="text-rust font-display text-xs tracking-widest">MUNDIAL 2026</p>
          <h1 className="font-display text-3xl text-white leading-none">ADMIN</h1>
        </div>
        <nav className="space-y-1 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                tab === id ? "bg-rust/15 text-rust font-medium" : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        <div className={`mx-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
          config.nominationsOpen ? "bg-green-500/10 text-green-400" : "bg-crimson/10 text-crimson"
        }`}>
          {config.nominationsOpen ? <Unlock size={12} /> : <Lock size={12} />}
          {config.nominationsOpen ? "Abierta" : "Cerrada"}
        </div>
      </aside>

      {/* Tab bar mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ink border-t border-white/10 flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] transition-colors ${
              tab === id ? "text-rust" : "text-white/30"
            }`}
          >
            <Icon size={18} />{label}
          </button>
        ))}
      </div>

      {/* Content — fondo blanco */}
      <main className="flex-1 bg-paper px-4 md:px-8 py-6 pb-24 md:pb-8">
        <div className="max-w-3xl">
          {tab === "dashboard" && <DashboardTab config={config} totalVoters={totalVoters} totalCars={totalCars} topCars={topCars} />}
          {tab === "autos"     && <AutosTab topCars={topCars} maxQualifiers={config.maxQualifiers} />}
          {tab === "votantes"  && <VotantesTab nominations={nominations} totalVoters={totalVoters} onDelete={handleDelete} />}
          {tab === "fixture"   && <FixtureTab topCars={topCars} maxQualifiers={config.maxQualifiers} phase={config.phase} groupCars={groupCars} />}
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function DashboardTab({ config, totalVoters, totalCars, topCars }: {
  config: AdminLayoutProps["config"]; totalVoters: number; totalCars: number; topCars: { car_name: string; total_nominations: number }[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl text-ink">DASHBOARD</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "personas", value: totalVoters, color: "text-rust" },
          { label: "clasificaciones", value: totalCars, color: "text-gold" },
          { label: "autos únicos", value: topCars.length, color: "text-muted" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-2xl p-4 text-center border border-border">
            <p className={`font-display text-3xl ${color}`}>{value.toLocaleString()}</p>
            <p className="text-xs text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <AdminControls config={config} />
    </div>
  );
}

// ─── Autos ───────────────────────────────────────────────────────────────────
function AutosTab({ topCars, maxQualifiers }: { topCars: { car_name: string; total_nominations: number }[]; maxQualifiers: number }) {
  const maxVotes = topCars[0]?.total_nominations ?? 1;
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink">AUTOS</h2>
        <span className="text-xs text-muted">{topCars.length} candidatos</span>
      </div>
      <p className="text-xs text-muted">Tocá el lápiz para corregir el nombre de un auto. Si lo renombrás igual a otro existente, se fusionan los votos.</p>
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="divide-y divide-border max-h-[calc(100vh-220px)] overflow-y-auto">
          {topCars.length === 0 && <p className="text-muted text-sm text-center py-10">Sin datos aún.</p>}
          {topCars.map((car, i) => (
            <CarRow key={car.car_name} car={car} rank={i} maxVotes={maxVotes} isIn={i < maxQualifiers} isCut={i === maxQualifiers - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CarRow({ car, rank, maxVotes, isIn, isCut }: {
  car: { car_name: string; total_nominations: number };
  rank: number; maxVotes: number; isIn: boolean; isCut: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(car.car_name);
  const [pending, startTransition] = useTransition();
  const pct = Math.round((car.total_nominations / maxVotes) * 100);

  const save = () => {
    const v = value.trim();
    if (!v || v === car.car_name) { setEditing(false); setValue(car.car_name); return; }
    startTransition(async () => { await renameCar(car.car_name, v); setEditing(false); });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-rust/5">
        <span className="font-display text-lg w-7 text-center shrink-0 text-muted/40">{rank + 1}</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setValue(car.car_name); } }}
          autoFocus
          className="flex-1 bg-white border-2 border-rust/40 rounded-lg px-3 py-1.5 text-sm text-ink outline-none"
        />
        <button onClick={save} disabled={pending} className="text-rust hover:text-rust-dark p-1 disabled:opacity-40" title="Guardar">
          <Check size={16} />
        </button>
        <button onClick={() => { setEditing(false); setValue(car.car_name); }} className="text-muted hover:text-crimson p-1" title="Cancelar">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 group ${isIn ? "" : "opacity-40"}`}>
      <span className={`font-display text-lg w-7 text-center shrink-0 ${rank === 0 ? "text-gold" : rank < 3 ? "text-muted" : "text-muted/40"}`}>
        {rank + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-ink truncate">{car.car_name}</span>
          <span className="text-xs text-muted shrink-0 ml-2">{car.total_nominations}</span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isIn ? "bg-rust" : "bg-border"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button onClick={() => setEditing(true)} className="text-muted/40 hover:text-rust p-1 shrink-0 transition-colors" title="Renombrar">
        <Pencil size={14} />
      </button>
      {isCut && <span className="text-[10px] text-crimson font-semibold shrink-0">CORTE</span>}
    </div>
  );
}

// ─── Votantes ─────────────────────────────────────────────────────────────────
function VotantesTab({ nominations, totalVoters, onDelete }: {
  nominations: { twitter_handle: string; email: string | null; created_at: string; cars: string[] }[];
  totalVoters: number;
  onDelete: (handle: string) => void;
}) {
  const emails = nominations.map((n) => n.email).filter(Boolean) as string[];

  const copyEmails = () => {
    navigator.clipboard.writeText(emails.join(", "));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink">VOTANTES</h2>
        <span className="text-xs text-muted">{totalVoters} en total · últimos 100</span>
      </div>

      {emails.length > 0 && (
        <button
          onClick={copyEmails}
          className="w-full flex items-center justify-center gap-2 bg-ink text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          Copiar {emails.length} email{emails.length > 1 ? "s" : ""} (separados por coma)
        </button>
      )}

      <div className="space-y-2">
        {nominations.length === 0 && <p className="text-muted text-sm text-center py-10">Sin votos aún.</p>}
        {nominations.map((nom) => (
          <NomCard key={nom.twitter_handle} nom={nom} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function NomCard({ nom, onDelete }: {
  nom: { twitter_handle: string; email: string | null; created_at: string; cars: string[] };
  onDelete: (handle: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  return (
    <div className="bg-white rounded-xl border border-border px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <a href={`https://x.com/${nom.twitter_handle}`} target="_blank" rel="noopener noreferrer"
          className="text-rust text-sm font-medium hover:underline">
          @{nom.twitter_handle}
        </a>
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs">
            {new Date(nom.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={() => {
              if (!confirm(`¿Borrar el voto de @${nom.twitter_handle}?`)) return;
              startTransition(async () => { await onDelete(nom.twitter_handle); setDeleted(true); });
            }}
            disabled={pending}
            className="text-muted hover:text-crimson transition-colors disabled:opacity-40"
            title="Borrar voto"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {nom.email && (
        <p className="text-xs text-muted mb-2 truncate">✉ {nom.email}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {nom.cars.length === 0 ? (
          <span className="bg-crimson/10 border border-crimson/20 text-crimson text-xs px-2 py-1 rounded-lg">
            ⚠ Sin autos (registro huérfano — borralo)
          </span>
        ) : nom.cars.map((car) => (
          <span key={car} className="bg-surface border border-border text-ink text-xs px-2 py-1 rounded-lg">{car}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Fixture / Armado del Mundial ──────────────────────────────────────────────
function FixtureTab({ topCars, maxQualifiers, phase, groupCars }: {
  topCars: { car_name: string; total_nominations: number }[];
  maxQualifiers: number;
  phase: TournamentPhase;
  groupCars: GroupCar[];
}) {
  const built = groupCars.length > 0;
  return built
    ? <BuiltGroups groupCars={groupCars} phase={phase} />
    : <BuildPanel topCars={topCars} maxQualifiers={maxQualifiers} />;
}

// Estado PREVIO al armado: preview + botón de armar
function BuildPanel({ topCars, maxQualifiers }: { topCars: { car_name: string; total_nominations: number }[]; maxQualifiers: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const qualifiers = topCars.slice(0, maxQualifiers);
  const enough = topCars.length >= maxQualifiers;

  const handleBuild = () => {
    if (!confirm(`¿Cerrar las clasificaciones y armar el Mundial con los ${maxQualifiers} más votados?\n\nEsto CIERRA las nominaciones y sortea los grupos. Podés re-sortear después, pero no se pueden agregar más votos de clasificación.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await buildTournament();
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl text-ink">ARMAR EL MUNDIAL</h2>

      <div className="bg-ink rounded-2xl p-5 space-y-3">
        <p className="text-white text-sm">
          Vas a cerrar las clasificaciones y armar los grupos con sistema de <strong>bombos (FIFA)</strong>:
          los más votados quedan separados como cabezas de serie.
        </p>
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span><strong className="text-white">{topCars.length}</strong> autos votados</span>
          <span><strong className="text-white">{maxQualifiers}</strong> clasifican</span>
          <span><strong className="text-white">{Math.floor(maxQualifiers / 4)}</strong> grupos de 4</span>
        </div>

        {!enough && (
          <div className="flex items-start gap-2 bg-crimson/15 border border-crimson/30 rounded-xl px-3 py-2.5 text-crimson text-xs">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            Solo hay {topCars.length} autos. Necesitás {maxQualifiers}. Bajá &quot;clasifican al mundial&quot; en el Dashboard.
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 bg-crimson/15 border border-crimson/30 rounded-xl px-3 py-2.5 text-crimson text-xs">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />{error}
          </div>
        )}

        <button
          onClick={handleBuild}
          disabled={pending || !enough}
          className="w-full flex items-center justify-center gap-2 bg-rust text-white font-display text-xl py-3 rounded-xl tracking-wide hover:bg-rust-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Shuffle size={18} />
          {pending ? "ARMANDO..." : "CERRAR CLASIFICACIÓN Y SORTEAR GRUPOS"}
        </button>
      </div>

      <p className="text-xs text-muted">Vista previa de los {maxQualifiers} que clasificarían (por ranking, sin sorteo todavía):</p>
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="divide-y divide-border max-h-[40vh] overflow-y-auto">
          {qualifiers.map((car, i) => (
            <div key={car.car_name} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`font-display text-base w-6 text-center shrink-0 ${i < 8 ? "text-gold" : "text-muted/50"}`}>{i + 1}</span>
              <span className="flex-1 text-sm text-ink truncate">{car.car_name}</span>
              {i < 8 && <span className="text-[10px] text-gold font-semibold shrink-0">BOMBO 1</span>}
              <span className="text-xs text-muted shrink-0">{car.total_nominations}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Estado POSTERIOR: grupos ya armados
function BuiltGroups({ groupCars, phase }: { groupCars: GroupCar[]; phase: TournamentPhase }) {
  const [pending, startTransition] = useTransition();
  const letters = [...new Set(groupCars.map((c) => c.group_letter).filter(Boolean))].sort() as string[];

  const handleResort = () => {
    if (!confirm("¿Volver a sortear los grupos? Se reasignan al azar de nuevo (mismos clasificados).")) return;
    startTransition(async () => { await buildTournament(); });
  };
  const handleReopen = () => {
    if (!confirm("¿Reabrir las clasificaciones? Esto BORRA los grupos armados y vuelve a la fase de votación de autos.")) return;
    startTransition(async () => { await reopenClassification(); });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink">GRUPOS</h2>
        <span className="text-xs text-muted">Fase: {phase}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={handleResort} disabled={pending}
          className="flex items-center gap-2 bg-ink text-white text-sm px-4 py-2.5 rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-40">
          <Shuffle size={14} />Re-sortear
        </button>
        <button onClick={handleReopen} disabled={pending}
          className="flex items-center gap-2 bg-white border border-crimson/30 text-crimson text-sm px-4 py-2.5 rounded-xl hover:bg-crimson/5 transition-colors disabled:opacity-40">
          <RotateCcw size={14} />Reabrir clasificación
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {letters.map((letter) => {
          const cars = groupCars.filter((c) => c.group_letter === letter).sort((a, b) => (a.group_position ?? 0) - (b.group_position ?? 0));
          return (
            <div key={letter} className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="bg-ink px-4 py-2">
                <span className="font-display text-cream text-xl tracking-wider">GRUPO {letter}</span>
              </div>
              <div className="divide-y divide-border">
                {cars.map((car, i) => (
                  <div key={car.car_name} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="font-display text-muted text-base w-4">{i + 1}</span>
                    <span className="flex-1 text-sm text-ink truncate">{car.car_name}</span>
                    <span className="text-xs text-muted shrink-0">{car.total_nominations}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
