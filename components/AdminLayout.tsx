"use client";

import { useState } from "react";
import { LayoutDashboard, Car, Users, Trophy, Lock, Unlock } from "lucide-react";
import AdminControls from "./AdminControls";
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

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-white/10 pt-8 pb-6 px-3">
        <div className="mb-8 px-2">
          <p className="text-rust font-display text-xs tracking-widest">MUNDIAL 2026</p>
          <h1 className="font-display text-3xl text-white leading-none">ADMIN</h1>
        </div>
        <nav className="space-y-1 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                tab === id
                  ? "bg-rust/15 text-rust font-medium"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
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
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] transition-colors ${
              tab === id ? "text-rust" : "text-white/30"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-8 max-w-3xl">
        {tab === "dashboard" && <DashboardTab config={config} totalVoters={totalVoters} totalCars={totalCars} topCars={topCars} />}
        {tab === "autos"     && <AutosTab topCars={topCars} maxQualifiers={config.maxQualifiers} />}
        {tab === "votantes"  && <VotantesTab nominations={recentNominations} totalVoters={totalVoters} />}
        {tab === "fixture"   && <FixtureTab topCars={topCars} maxQualifiers={config.maxQualifiers} />}
      </main>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
function DashboardTab({ config, totalVoters, totalCars, topCars }: {
  config: AdminLayoutProps["config"];
  totalVoters: number;
  totalCars: number;
  topCars: { car_name: string; total_nominations: number }[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl text-white">DASHBOARD</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "personas", value: totalVoters, icon: Users, color: "text-rust" },
          { label: "clasificaciones", value: totalCars, icon: Car, color: "text-gold" },
          { label: "autos únicos", value: topCars.length, icon: Trophy, color: "text-white/40" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/5 rounded-2xl p-4 text-center">
            <Icon size={18} className={`${color} mx-auto mb-1`} />
            <p className="font-display text-3xl text-white">{value.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <AdminControls config={config} />
    </div>
  );
}

// ─── Autos ──────────────────────────────────────────────────────────────────
function AutosTab({ topCars, maxQualifiers }: { topCars: { car_name: string; total_nominations: number }[]; maxQualifiers: number }) {
  const maxVotes = topCars[0]?.total_nominations ?? 1;
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-white">AUTOS</h2>
        <span className="text-xs text-white/30">{topCars.length} candidatos</span>
      </div>

      <div className="bg-white/5 rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {topCars.length === 0 && (
            <p className="text-white/30 text-sm text-center py-10">Sin datos aún.</p>
          )}
          {topCars.map((car, i) => {
            const isIn = i < maxQualifiers;
            const pct = Math.round((car.total_nominations / maxVotes) * 100);
            return (
              <div key={car.car_name} className={`flex items-center gap-3 px-4 py-3 ${isIn ? "" : "opacity-35"}`}>
                <span className={`font-display text-lg w-7 text-center shrink-0 ${i === 0 ? "text-gold" : i < 3 ? "text-white/60" : "text-white/20"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate">{car.car_name}</span>
                    <span className="text-xs text-white/40 shrink-0 ml-2">{car.total_nominations}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isIn ? "bg-rust" : "bg-white/20"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {i === maxQualifiers - 1 && (
                  <span className="text-[10px] text-crimson/70 font-semibold shrink-0 ml-1">CORTE</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Votantes ────────────────────────────────────────────────────────────────
function VotantesTab({ nominations, totalVoters }: {
  nominations: { twitter_handle: string; created_at: string; cars: string[] }[];
  totalVoters: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-white">VOTANTES</h2>
        <span className="text-xs text-white/30">{totalVoters} en total · últimos 30</span>
      </div>

      <div className="space-y-2">
        {nominations.length === 0 && (
          <p className="text-white/30 text-sm text-center py-10">Sin votos aún.</p>
        )}
        {nominations.map((nom) => (
          <div key={nom.twitter_handle} className="bg-white/5 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <a
                href={`https://x.com/${nom.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-rust text-sm font-medium hover:underline"
              >
                @{nom.twitter_handle}
              </a>
              <span className="text-white/25 text-xs">
                {new Date(nom.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {nom.cars.map((car) => (
                <span key={car} className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-lg">{car}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fixture Preview ────────────────────────────────────────────────────────
const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function FixtureTab({ topCars, maxQualifiers }: { topCars: { car_name: string; total_nominations: number }[]; maxQualifiers: number }) {
  const qualifiers = topCars.slice(0, maxQualifiers);
  const groupCount = maxQualifiers <= 16 ? 4 : maxQualifiers <= 24 ? 6 : 8;
  const groups = GROUP_LETTERS.slice(0, groupCount).map((letter, gi) => ({
    letter,
    cars: qualifiers.slice(gi * 4, gi * 4 + 4),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-white">FIXTURE PREVIEW</h2>
        <span className="text-xs text-white/30">top {maxQualifiers} actuales</span>
      </div>

      {qualifiers.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-10">Sin datos suficientes.</p>
      ) : (
        <>
          <div className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-2.5 text-xs text-white/60">
            Vista previa basada en el ranking actual. Los grupos reales se arman cuando cerrés la clasificación.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groups.map((group) => (
              <div key={group.letter} className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                <div className="bg-white/10 px-4 py-2">
                  <span className="font-display text-white text-xl tracking-wider">GRUPO {group.letter}</span>
                </div>
                <div className="divide-y divide-white/5">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="font-display text-white/30 text-base w-4">{i + 1}</span>
                      {group.cars[i] ? (
                        <span className="text-sm text-white/80">{group.cars[i].car_name}</span>
                      ) : (
                        <span className="text-xs text-white/20 italic">— vacante —</span>
                      )}
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
