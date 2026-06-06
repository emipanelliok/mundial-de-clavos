import { supabase, IS_CONFIGURED } from "@/lib/supabase";
import AdminPanel from "@/components/AdminPanel";
import type { TournamentPhase } from "@/lib/supabase";

export const revalidate = 0;

async function getAdminData() {
  if (!IS_CONFIGURED) {
    return { config: { phase: "eliminatorias" as TournamentPhase, max_qualifiers: 32, nominations_open: true }, topCars: [], totalVoters: 0 };
  }
  try {
    const [
      { data: config },
      { data: topCars },
      { count: totalVoters },
    ] = await Promise.all([
      supabase
        .from("tournament_config")
        .select("phase, max_qualifiers, nominations_open")
        .single(),
      supabase
        .from("car_nomination_counts")
        .select("car_name, total_nominations")
        .order("total_nominations", { ascending: false })
        .limit(50),
      supabase
        .from("nominations")
        .select("*", { count: "exact", head: true }),
    ]);

    return {
      config: config ?? {
        phase: "eliminatorias" as TournamentPhase,
        max_qualifiers: 32,
        nominations_open: true,
      },
      topCars: topCars ?? [],
      totalVoters: totalVoters ?? 0,
    };
  } catch {
    return {
      config: {
        phase: "eliminatorias" as TournamentPhase,
        max_qualifiers: 32,
        nominations_open: true,
      },
      topCars: [],
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
          <p className="text-rust font-display text-sm tracking-widest">
            PANEL DE CONTROL
          </p>
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
