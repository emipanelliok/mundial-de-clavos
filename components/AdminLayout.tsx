"use client";

import { useState, useTransition } from "react";
import { LayoutDashboard, Car, Users, Trophy, Lock, Unlock, Trash2 } from "lucide-react";
import AdminControls from "./AdminControls";
import { deleteNomination } from "@/app/admin/actions";
import type { TournamentPhase } from "@/lib/db";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "autos",     label: "Autos",     icon: Car },
  { id: "votantes",  label: "Votantes",  icon: Users },
  { id: "fixture",   label: "Fixture",   icon: Trophy },
] as const;

type Tab = (typeof TABS)[number]["id"];

interface AdminLayoutProps {
  config: { phase: TournamentPhase; maxQualifiers: number; nominationsOpen: boolean; phaseEndsAt: string | null };
  topCars: { car_name: string; total_nominations: number }[];
  recentNominations: { twitter_handle: string; created_at: string; cars: string[] }[];
  totalVoters: number;
  totalCars: number;
}

export default function AdminLayout({ config, topCars, recentNominations, totalVoters, totalCars }: AdminLayoutProps) {
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
          {tab === "fixture"   && <FixtureTab topCars={topCars} maxQualifiers={config.maxQualifiers} />}
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
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="divide-y divide-border max-h-[calc(100vh-200px)] overflow-y-auto">
          {topCars.length === 0 && <p className="text-muted text-sm text-center py-10">Sin datos aún.</p>}
          {topCars.map((car, i) => {
            const isIn = i < maxQualifiers;
            const pct = Math.round((car.total_nominations / maxVotes) * 100);
            return (
              <div key={car.car_name} className={`flex items-center gap-3 px-4 py-3 ${isIn ? "" : "opacity-40"}`}>
                <span className={`font-display text-lg w-7 text-center shrink-0 ${i === 0 ? "text-gold" : i < 3 ? "text-muted" : "text-muted/40"}`}>
                  {i + 1}
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
                {i === maxQualifiers - 1 && <span className="text-[10px] text-crimson font-semibold shrink-0 ml-1">CORTE</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Votantes ─────────────────────────────────────────────────────────────────
function VotantesTab({ nominations, totalVoters, onDelete }: {
  nominations: { twitter_handle: string; created_at: string; cars: string[] }[];
  totalVoters: number;
  onDelete: (handle: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink">VOTANTES</h2>
        <span className="text-xs text-muted">{totalVoters} en total · últimos 100</span>
      </div>
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
  nom: { twitter_handle: string; created_at: string; cars: string[] };
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
      <div className="flex flex-wrap gap-1.5">
        {nom.cars.map((car) => (
          <span key={car} className="bg-surface border border-border text-ink text-xs px-2 py-1 rounded-lg">{car}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Fixture Preview ──────────────────────────────────────────────────────────
const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function FixtureTab({ topCars, maxQualifiers }: { topCars: { car_name: string; total_nominations: number }[]; maxQualifiers: number }) {
  const qualifiers = topCars.slice(0, maxQualifiers);
  const groupCount = maxQualifiers <= 16 ? 4 : maxQualifiers <= 24 ? 6 : 8;
  const groups = GROUP_LETTERS.slice(0, groupCount).map((letter, gi) => ({
    letter, cars: qualifiers.slice(gi * 4, gi * 4 + 4),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink">FIXTURE PREVIEW</h2>
        <span className="text-xs text-muted">top {maxQualifiers} actuales</span>
      </div>
      {qualifiers.length === 0 ? (
        <p className="text-muted text-sm text-center py-10">Sin datos suficientes.</p>
      ) : (
        <>
          <div className="bg-gold/10 border border-gold/25 rounded-xl px-4 py-2.5 text-xs text-ink/60">
            Vista previa basada en el ranking actual. Los grupos reales se arman cuando cerrés la clasificación.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groups.map((group) => (
              <div key={group.letter} className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-ink px-4 py-2">
                  <span className="font-display text-cream text-xl tracking-wider">GRUPO {group.letter}</span>
                </div>
                <div className="divide-y divide-border">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="font-display text-muted text-base w-4">{i + 1}</span>
                      {group.cars[i]
                        ? <span className="text-sm text-ink">{group.cars[i].car_name}</span>
                        : <span className="text-xs text-muted/40 italic">— vacante —</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
