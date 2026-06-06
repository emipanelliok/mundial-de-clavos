import { sql, IS_CONFIGURED } from "@/lib/db";
import AdminPanel from "@/components/AdminPanel";
import type { TournamentPhase } from "@/lib/db";

export const revalidate = 0;

async function getAdminData() {
  if (!IS_CONFIGURED || !sql) {
    return {
      config: { phase: "eliminatorias" as TournamentPhase, max_qualifiers: 32, nominations_open: true },
      topCars: [],
      totalVoters: 0,
    };
  }
  try {
    const [[config], topCars, [voters]] = await Promise.all([
      sql`SELECT phase, max_qualifiers, nominations_open FROM tournament_config WHERE id = 1`,
      sql`
        SELECT car_name, count(*)::int AS total_nominations
        FROM nomination_cars
        GROUP BY car_name
        ORDER BY total_nominations DESC
        LIMIT 50
      `,
      sql`SELECT count(*)::int AS n FROM nominations`,
    ]);
    return {
      config: config ?? { phase: "eliminatorias" as TournamentPhase, max_qualifiers: 32, nominations_open: true },
      topCars: (topCars ?? []) as { car_name: string; total_nominations: number }[],
      totalVoters: voters?.n ?? 0,
    };
  } catch {
    return {
      config: { phase: "eliminatorias" as TournamentPhase, max_qualifiers: 32, nominations_open: true },
      topCars: [] as { car_name: string; total_nominations: number }[],
      totalVoters: 0,
    };
  }
}

export default async function AdminPage() {
  const data = await getAdminData();

  return (
    <main className="min-h-screen bg-ink text-white px-4 py-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <p className="text-rust font-display text-sm tracking-widest">PANEL DE CONTROL</p>
          <h1 className="font-display text-4xl text-white">ADMIN</h1>
        </div>
        <AdminPanel
          config={{
            phase: data.config.phase as TournamentPhase,
            maxQualifiers: data.config.max_qualifiers,
            nominationsOpen: data.config.nominations_open,
          }}
          topCars={data.topCars}
          totalVoters={data.totalVoters}
        />
      </div>
    </main>
  );
}
