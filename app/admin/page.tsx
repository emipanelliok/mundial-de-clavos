import { sql, IS_CONFIGURED } from "@/lib/db";
import AdminLayout from "@/components/AdminLayout";
import type { TournamentPhase } from "@/lib/db";

export const revalidate = 0;

async function getAdminData() {
  const empty = {
    config: { phase: "eliminatorias" as TournamentPhase, max_qualifiers: 32, nominations_open: true, phase_ends_at: null as string | null },
    topCars: [] as { car_name: string; total_nominations: number }[],
    recentNominations: [] as { twitter_handle: string; email: string | null; created_at: string; cars: string[] }[],
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
        LIMIT 200
      `,
      sql`SELECT count(*)::int AS n FROM nominations`,
      sql`SELECT count(*)::int AS n FROM nomination_cars`,
      sql`
        SELECT n.twitter_handle, n.email, n.created_at,
               array_remove(array_agg(nc.car_name ORDER BY nc.created_at), NULL) AS cars
        FROM nominations n
        LEFT JOIN nomination_cars nc ON nc.nomination_id = n.id
        GROUP BY n.id, n.twitter_handle, n.email, n.created_at
        ORDER BY n.created_at DESC
        LIMIT 100
      `,
    ]);

    return {
      config: config ?? empty.config,
      topCars: (topCars ?? []) as { car_name: string; total_nominations: number }[],
      recentNominations: (recent ?? []) as { twitter_handle: string; email: string | null; created_at: string; cars: string[] }[],
      totalVoters: voters?.n ?? 0,
      totalCars: cars?.n ?? 0,
    };
  } catch (e) {
    console.error("Admin data error:", e);
    return empty;
  }
}

export default async function AdminPage() {
  const { config, topCars, recentNominations, totalVoters, totalCars } = await getAdminData();

  return (
    <AdminLayout
      config={{
        phase: config.phase as TournamentPhase,
        maxQualifiers: config.max_qualifiers,
        nominationsOpen: config.nominations_open,
        phaseEndsAt: config.phase_ends_at,
      }}
      topCars={topCars}
      recentNominations={recentNominations}
      totalVoters={totalVoters}
      totalCars={totalCars}
    />
  );
}
