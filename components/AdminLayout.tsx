"use client";

import { useState, useTransition } from "react";
import { LayoutDashboard, Car, Users, Trophy, Image as ImageIcon, Lock, Unlock, Trash2, Pencil, Check, X, Shuffle, RotateCcw, AlertTriangle, ChevronRight } from "lucide-react";
import AdminControls from "./AdminControls";
import { deleteNomination, renameCar, buildTournament, reopenClassification, advanceRound, setCarImage } from "@/app/admin/actions";
import type { TournamentPhase } from "@/lib/db";
import type { BracketMatch } from "@/app/actions";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "autos",     label: "Autos",     icon: Car },
  { id: "votantes",  label: "Votantes",  icon: Users },
  { id: "fixture",   label: "Fixture",   icon: Trophy },
  { id: "fotos",     label: "Fotos",     icon: ImageIcon },
] as const;

type PhotoCar = { id: string; car_name: string; image_url: string | null; group_letter: string | null };

type Tab = (typeof TABS)[number]["id"];

type GroupCar = { car_name: string; total_nominations: number; seed: number | null; group_letter: string | null; group_position: number | null; group_votes: number };

interface AdminLayoutProps {
  config: { phase: TournamentPhase; maxQualifiers: number; nominationsOpen: boolean; phaseEndsAt: string | null };
  topCars: { car_name: string; total_nominations: number }[];
  recentNominations: { twitter_handle: string; email: string | null; created_at: string; cars: string[] }[];
  groupCars: GroupCar[];
  groupVoters: number;
  photoCars: PhotoCar[];
  bracketMatches: BracketMatch[];
  totalVoters: number;
  totalCars: number;
}

export default function AdminLayout({ config, topCars, recentNominations, groupCars, groupVoters, photoCars, bracketMatches, totalVoters, totalCars }: AdminLayoutProps) {
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
          {tab === "fixture"   && <FixtureTab topCars={topCars} maxQualifiers={config.maxQualifiers} phase={config.phase} groupCars={groupCars} groupVoters={groupVoters} bracketMatches={bracketMatches} />}
          {tab === "fotos"     && <PhotosTab cars={photoCars} />}
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
const KNOCKOUT_PHASES = ["octavos", "cuartos", "semifinal", "final", "terminado"];

function FixtureTab({ topCars, maxQualifiers, phase, groupCars, groupVoters, bracketMatches }: {
  topCars: { car_name: string; total_nominations: number }[];
  maxQualifiers: number;
  phase: TournamentPhase;
  groupCars: GroupCar[];
  groupVoters: number;
  bracketMatches: BracketMatch[];
}) {
  if (KNOCKOUT_PHASES.includes(phase)) return <KnockoutPanel phase={phase} bracketMatches={bracketMatches} />;
  if (groupCars.length > 0) return <BuiltGroups groupCars={groupCars} phase={phase} groupVoters={groupVoters} />;
  return <BuildPanel topCars={topCars} maxQualifiers={maxQualifiers} />;
}

// Panel de fases eliminatorias: partidos de la ronda + botón avanzar
const NEXT_LABEL: Record<string, string> = {
  octavos: "CUARTOS", cuartos: "SEMIFINAL", semifinal: "FINAL", final: "CORONAR CAMPEÓN",
};
const PHASE_LABEL: Record<string, string> = {
  octavos: "OCTAVOS", cuartos: "CUARTOS", semifinal: "SEMIFINAL", final: "FINAL", terminado: "TERMINADO",
};

function KnockoutPanel({ phase, bracketMatches }: { phase: TournamentPhase; bracketMatches: BracketMatch[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const current = bracketMatches.filter((m) => m.phase === phase);

  // campeón (fase terminada): ganador de la final
  if (phase === "terminado") {
    const final = bracketMatches.find((m) => m.phase === "final");
    const champ = final?.winner_id === final?.car1_id ? final?.car1_name : final?.car2_name;
    return (
      <div className="space-y-4 text-center py-8">
        <h2 className="font-display text-3xl text-ink">🏆 GRAN CAMPEÓN</h2>
        <p className="font-display text-5xl text-rust">{champ ?? "—"}</p>
        <p className="text-sm text-muted">El Mundial de Clavos 2026 terminó.</p>
      </div>
    );
  }

  const handleAdvance = () => {
    const lbl = NEXT_LABEL[phase] ?? "siguiente ronda";
    if (!confirm(`¿Cerrar ${PHASE_LABEL[phase]} y avanzar a ${lbl}?\n\nSe calcula el ganador de cada partido por votos y se arma la siguiente ronda. No se puede deshacer fácil.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await advanceRound();
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink">{PHASE_LABEL[phase]}</h2>
        <span className="text-xs text-muted">{current.length} partidos</span>
      </div>

      <div className="bg-ink rounded-2xl p-4 space-y-3">
        <p className="text-white/70 text-sm">
          Cuando cierre la votación de <strong className="text-white">{PHASE_LABEL[phase]}</strong>, avanzá a la siguiente ronda.
          El más votado de cada cruce pasa.
        </p>
        {error && (
          <div className="flex items-start gap-2 bg-crimson/15 border border-crimson/30 rounded-xl px-3 py-2.5 text-crimson text-xs">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />{error}
          </div>
        )}
        <button
          onClick={handleAdvance}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 bg-rust text-white font-display text-xl py-3 rounded-xl tracking-wide hover:bg-rust-dark transition-colors disabled:opacity-40"
        >
          {pending ? "PROCESANDO..." : <>CERRAR {PHASE_LABEL[phase]} → {NEXT_LABEL[phase]}<ChevronRight size={18} /></>}
        </button>
      </div>

      <div className="space-y-2">
        {current.map((m, i) => {
          const decided = !m.is_active && m.winner_id;
          const w1 = decided && m.winner_id === m.car1_id;
          const w2 = decided && m.winner_id === m.car2_id;
          return (
            <div key={i} className="bg-white rounded-xl border border-border px-4 py-3 shadow-sm">
              <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Partido {m.match_number}</p>
              <div className="flex items-center gap-3">
                <span className={`flex-1 text-sm ${w1 ? "text-rust font-bold" : "text-ink"}`}>{m.car1_name ?? "—"}</span>
                <span className={`font-display text-lg tabular-nums ${w1 ? "text-rust" : "text-muted"}`}>{m.car1_votes}</span>
                <span className="text-muted text-xs">vs</span>
                <span className={`font-display text-lg tabular-nums ${w2 ? "text-rust" : "text-muted"}`}>{m.car2_votes}</span>
                <span className={`flex-1 text-sm text-right ${w2 ? "text-rust font-bold" : "text-ink"}`}>{m.car2_name ?? "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Fotos ──────────────────────────────────────────────────────────────────────
function PhotosTab({ cars }: { cars: PhotoCar[] }) {
  const withPhoto = cars.filter((c) => c.image_url).length;
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink">FOTOS</h2>
        <span className="text-xs text-muted">{withPhoto}/{cars.length} con foto</span>
      </div>
      <p className="text-xs text-muted">
        Pegá la URL de una imagen para cada auto (clic derecho → &quot;Copiar dirección de la imagen&quot; en Google Imágenes).
        Aparecen en las llaves y en la votación 1v1.
      </p>
      {cars.length === 0 ? (
        <p className="text-muted text-sm text-center py-10">Todavía no hay autos en el torneo.</p>
      ) : (
        <div className="space-y-2">
          {cars.map((c) => <PhotoRow key={c.id} car={c} />)}
        </div>
      )}
    </div>
  );
}

function PhotoRow({ car }: { car: PhotoCar }) {
  const [url, setUrl] = useState(car.image_url ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const dirty = url !== (car.image_url ?? "");

  const save = () => {
    startTransition(async () => {
      await setCarImage(car.id, url);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-border p-3 shadow-sm flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface shrink-0 flex items-center justify-center">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={16} className="text-muted/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink font-medium truncate mb-1">
          {car.group_letter && <span className="text-muted text-xs mr-1">{car.group_letter}</span>}
          {car.car_name}
        </p>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://...jpg"
          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink outline-none focus:border-rust/40"
        />
      </div>
      <button
        onClick={save}
        disabled={pending || (!dirty && !saved)}
        className={`shrink-0 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
          saved ? "bg-green-600 text-white" : dirty ? "bg-rust text-white hover:bg-rust-dark" : "bg-surface text-muted/40"
        }`}
      >
        {pending ? "..." : saved ? "✓" : "Guardar"}
      </button>
    </div>
  );
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

// Estado POSTERIOR: grupos ya armados — con votos de fase de grupos en vivo
function BuiltGroups({ groupCars, phase, groupVoters }: { groupCars: GroupCar[]; phase: TournamentPhase; groupVoters: number }) {
  const [pending, startTransition] = useTransition();
  const letters = [...new Set(groupCars.map((c) => c.group_letter).filter(Boolean))].sort() as string[];
  const totalGroupVotes = groupCars.reduce((s, c) => s + c.group_votes, 0);

  const [error, setError] = useState<string | null>(null);

  const handleResort = () => {
    if (!confirm("¿Volver a sortear los grupos? Se reasignan al azar de nuevo (mismos clasificados).\n\nOJO: si ya hay votos de fase de grupos, se BORRAN.")) return;
    startTransition(async () => { await buildTournament(); });
  };
  const handleReopen = () => {
    if (!confirm("¿Reabrir las clasificaciones? Esto BORRA los grupos armados y los votos de fase de grupos, y vuelve a la votación de autos.")) return;
    startTransition(async () => { await reopenClassification(); });
  };
  const handleAdvance = () => {
    if (!confirm("¿Cerrar la fase de grupos y armar los OCTAVOS?\n\nPasan los 2 más votados de cada grupo (marcados PASA). Esto cierra la votación de grupos.")) return;
    setError(null);
    startTransition(async () => {
      const res = await advanceRound();
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-ink">GRUPOS</h2>
        <span className="text-xs text-muted">Fase: {phase}</span>
      </div>

      {/* Resumen votación de grupos */}
      <div className="bg-ink rounded-2xl p-4 flex items-center gap-6">
        <div>
          <p className="font-display text-3xl text-rust leading-none">{groupVoters.toLocaleString()}</p>
          <p className="text-xs text-white/50 mt-0.5">votantes de grupos</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div>
          <p className="font-display text-3xl text-white leading-none">{totalGroupVotes.toLocaleString()}</p>
          <p className="text-xs text-white/50 mt-0.5">votos emitidos</p>
        </div>
      </div>

      {/* Avanzar a octavos */}
      <button
        onClick={handleAdvance}
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-rust text-white font-display text-xl py-3 rounded-xl tracking-wide hover:bg-rust-dark transition-colors disabled:opacity-40"
      >
        {pending ? "PROCESANDO..." : <>CERRAR GRUPOS → ARMAR OCTAVOS<ChevronRight size={18} /></>}
      </button>
      {error && (
        <div className="flex items-start gap-2 bg-crimson/15 border border-crimson/30 rounded-xl px-3 py-2.5 text-crimson text-xs">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />{error}
        </div>
      )}

      <p className="text-xs text-muted">
        Ordenado por votos de la fase de grupos. Los <strong className="text-rust">2 primeros</strong> de cada grupo (marcados PASA) avanzan a octavos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {letters.map((letter) => {
          // ordenar por votos de grupos desc; desempate por votos de clasificación
          const cars = groupCars
            .filter((c) => c.group_letter === letter)
            .sort((a, b) => b.group_votes - a.group_votes || b.total_nominations - a.total_nominations);
          return (
            <div key={letter} className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="bg-ink px-4 py-2">
                <span className="font-display text-cream text-xl tracking-wider">GRUPO {letter}</span>
              </div>
              <div className="divide-y divide-border">
                {cars.map((car, i) => {
                  const passes = i < 2;
                  return (
                    <div key={car.car_name} className={`flex items-center gap-3 px-4 py-2.5 ${passes ? "bg-rust/5" : ""}`}>
                      <span className={`font-display text-base w-4 ${passes ? "text-rust" : "text-muted/40"}`}>{i + 1}</span>
                      <span className="flex-1 text-sm text-ink truncate">{car.car_name}</span>
                      {passes && <span className="text-[9px] bg-rust text-white font-semibold px-1.5 py-0.5 rounded shrink-0">PASA</span>}
                      <span className={`text-sm font-display shrink-0 ${car.group_votes > 0 ? "text-ink" : "text-muted/40"}`}>{car.group_votes}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
