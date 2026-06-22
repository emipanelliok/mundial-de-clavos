import { sql, IS_CONFIGURED } from "@/lib/db";
import AdminLayout from "@/components/AdminLayout";
import { getBracketMatches } from "../actions";
import type { TournamentPhase } from "@/lib/db";

export const revalidate = 0;

async function getAdminData() {
  const empty = {
    config: { phase: "eliminatorias" as TournamentPhase, max_qualifiers: 32, nominations_open: true, phase_ends_at: null as string | null },
    topCars: [] as { car_name: string; total_nominations: number }[],
    recentNominations: [] as { twitter_handle: string; email: string | null; created_at: string; cars: string[] }[],
    groupCars: [] as { car_name: string; total_nominations: number; seed: number | null; group_letter: string | null; group_position: number | null; group_votes: number }[],
    groupVoters: 0,
    photoCars: [] as { id: string; car_name: string; image_url: string | null; group_letter: string | null }[],
    bracketMatches: [] as Awaited<ReturnType<typeof getBracketMatches>>,
    totalVoters: 0,
    totalCars: 0,
  };

  if (!IS_CONFIGURED || !sql) return empty;

  try {
    const [[config], topCars, [voters], [cars], recent, groupCars, groupVoters] = await Promise.all([
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
      sql`
        SELECT tc.car_name, tc.total_nominations, tc.seed, tc.group_letter, tc.group_position,
               count(gv.id)::int AS group_votes
        FROM tournament_cars tc
        LEFT JOIN group_votes gv ON gv.tournament_car_id = tc.id
        GROUP BY tc.id, tc.car_name, tc.total_nominations, tc.seed, tc.group_letter, tc.group_position
        ORDER BY tc.group_letter ASC, tc.group_position ASC
      `,
      sql`SELECT count(distinct voter_handle)::int AS n FROM group_votes`,
    ]);

    const [photoCars, bracketMatches] = await Promise.all([
      sql`SELECT id, car_name, image_url, group_letter FROM tournament_cars ORDER BY group_letter ASC, group_position ASC`,
      getBracketMatches(),
    ]);

    return {
      config: config ?? empty.config,
      topCars: (topCars ?? []) as { car_name: string; total_nominations: number }[],
      recentNominations: (recent ?? []) as { twitter_handle: string; email: string | null; created_at: string; cars: string[] }[],
      groupCars: (groupCars ?? []) as { car_name: string; total_nominations: number; seed: number | null; group_letter: string | null; group_position: number | null; group_votes: number }[],
      groupVoters: (groupVoters as { n: number }[] | undefined)?.[0]?.n ?? 0,
      photoCars: (photoCars ?? []) as { id: string; car_name: string; image_url: string | null; group_letter: string | null }[],
      bracketMatches,
      totalVoters: voters?.n ?? 0,
      totalCars: cars?.n ?? 0,
    };
  } catch (e) {
    console.error("Admin data error:", e);
    return empty;
  }
}

export default async function AdminPage() {
  const { config, topCars, recentNominations, groupCars, groupVoters, photoCars, bracketMatches, totalVoters, totalCars } = await getAdminData();

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
      groupCars={groupCars}
      groupVoters={groupVoters}
      photoCars={photoCars}
      bracketMatches={bracketMatches}
      totalVoters={totalVoters}
      totalCars={totalCars}
    />
  );
}
