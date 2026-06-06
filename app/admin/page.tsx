import { sql, IS_CONFIGURED } from "@/lib/db";
import AdminControls from "@/components/AdminControls";
import type { TournamentPhase } from "@/lib/db";
import { Lock, Unlock, Users, Car, Trophy } from "lucide-react";

export const revalidate = 0;

async function getAdminData() {
  const empty = {
    config: { phase: "eliminatorias" as TournamentPhase, max_qualifiers: 32, nominations_open: true, phase_ends_at: null as string | null },
    topCars: [] as { car_name: string; total_nominations: number }[],
    recentNominations: [] as { twitter_handle: string; created_at: string; cars: string[] }[],
    totalVoters: 0,
    totalCars: 0,
  };

  if (!IS_CONFIGURED || !sql) return empty;

  try {
    const [[config], topCars, [voters], [cars], recent] = await Promise.all([
      sql`SELECT phase, max_qualifiers, nominations_open, phase_ends_at FROM tournament_config WHERE id = 1`,
      sql`
        SELECT car_name, count(*)::int AS total_nominations
        FROM nomination_cars
        GROUP BY car_name
        ORDER BY total_nominations DESC
        LIMIT 100
      `,
      sql`SELECT count(*)::int AS n FROM nominations`,
      sql`SELECT count(*)::int AS n FROM nomination_cars`,
      sql`
        SELECT n.twitter_handle, n.created_at,
               array_agg(nc.car_name ORDER BY nc.created_at) AS cars
        FROM nominations n
        JOIN nomination_cars nc ON nc.nomination_id = n.id
        GROUP BY n.id, n.twitter_handle, n.created_at
        ORDER BY n.created_at DESC
        LIMIT 30
      `,
    ]);

    return {
      config: config ?? empty.config,
      topCars: (topCars ?? []) as { car_name: string; total_nominations: number }[],
      recentNominations: (recent ?? []) as { twitter_handle: string; created_at: string; cars: string[] }[],
      totalVoters: voters?.n ?? 0,
      totalCars: cars?.n ?? 0,
    };
  } catch (e) {
    console.error("Admin data error:", e);
    return empty;
  }
}

export default async function AdminPage() {
  const data = await getAdminData();
  const { config, topCars, recentNominations, totalVoters, totalCars } = data;

  return (
    <main className="min-h-screen bg-ink text-white px-4 py-6 pb-16">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-rust font-display text-sm tracking-widest">MUNDIAL DE CLAVOS 2026</p>
            <h1 className="font-display text-5xl text-white leading-none">ADMIN</h1>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            config.nominations_open
              ? "bg-green-500/15 text-green-400 border border-green-500/20"
              : "bg-crimson/15 text-crimson border border-crimson/20"
          }`}>
            {config.nominations_open ? <Unlock size={12} /> : <Lock size={12} />}
            {config.nominations_open ? "Clasificación abierta" : "Clasificación cerrada"}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Users size={18} className="text-rust mx-auto mb-1" />
            <p className="font-display text-3xl text-white">{totalVoters.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-0.5">personas</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Car size={18} className="text-gold mx-auto mb-1" />
            <p className="font-display text-3xl text-white">{totalCars.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-0.5">clasificaciones</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Trophy size={18} className="text-white/40 mx-auto mb-1" />
            <p className="font-display text-3xl text-white">{topCars.length}</p>
            <p className="text-xs text-white/40 mt-0.5">autos únicos</p>
          </div>
        </div>

        {/* Controls */}
        <AdminControls
          config={{ phase: config.phase as TournamentPhase, maxQualifiers: config.max_qualifiers, nominationsOpen: config.nominations_open, phaseEndsAt: config.phase_ends_at }}
        />

        {/* Ranking completo */}
        <div className="space-y-3">
          <h2 className="font-display text-2xl text-white tracking-wide">
            RANKING — TOP {topCars.length}
          </h2>
          <div className="bg-white/5 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
              {topCars.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">Sin datos aún.</p>
              ) : topCars.map((car, i) => {
                const maxVotes = topCars[0]?.total_nominations ?? 1;
                const pct = Math.round((car.total_nominations / maxVotes) * 100);
                const isQualifier = i < config.max_qualifiers;
                return (
                  <div key={car.car_name} className={`flex items-center gap-3 px-4 py-3 ${isQualifier ? "" : "opacity-40"}`}>
                    <span className={`font-display text-lg w-7 text-center shrink-0 ${
                      i === 0 ? "text-gold" : i < 3 ? "text-white/60" : "text-white/25"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white truncate">{car.car_name}</span>
                        <span className="text-xs text-white/40 shrink-0 ml-2">
                          {car.total_nominations} {car.total_nominations === 1 ? "voto" : "votos"}
                        </span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isQualifier ? "bg-rust" : "bg-white/20"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {i === config.max_qualifiers - 1 && (
                      <span className="text-[10px] text-rust/70 font-medium shrink-0">CORTE</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nominaciones recientes */}
        <div className="space-y-3">
          <h2 className="font-display text-2xl text-white tracking-wide">
            ÚLTIMAS CLASIFICACIONES
          </h2>
          <div className="space-y-2">
            {recentNominations.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Sin datos aún.</p>
            ) : recentNominations.map((nom) => (
              <div key={nom.twitter_handle} className="bg-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-rust text-sm font-medium">@{nom.twitter_handle}</span>
                  <span className="text-white/25 text-xs">
                    {new Date(nom.created_at).toLocaleDateString("es-AR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {nom.cars.map((car) => (
                    <span key={car} className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-lg">
                      {car}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
