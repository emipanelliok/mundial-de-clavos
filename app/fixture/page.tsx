import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { supabase, IS_CONFIGURED } from "@/lib/supabase";
import FixtureView from "@/components/FixtureView";
import PhaseBar from "@/components/PhaseBar";
import type { TournamentPhase, TournamentCar } from "@/lib/supabase";

export const revalidate = 60;

async function getFixtureData() {
  if (!IS_CONFIGURED) {
    return { phase: "eliminatorias" as TournamentPhase, maxQualifiers: 32, cars: [] as TournamentCar[] };
  }
  try {
    const [{ data: config }, { data: cars }] = await Promise.all([
      supabase
        .from("tournament_config")
        .select("phase, max_qualifiers")
        .single(),
      supabase
        .from("tournament_cars")
        .select("*")
        .order("seed", { ascending: true }),
    ]);

    return {
      phase: (config?.phase ?? "eliminatorias") as TournamentPhase,
      maxQualifiers: config?.max_qualifiers ?? 32,
      cars: (cars ?? []) as TournamentCar[],
    };
  } catch {
    return {
      phase: "eliminatorias" as TournamentPhase,
      maxQualifiers: 32,
      cars: [] as TournamentCar[],
    };
  }
}

export default async function FixturePage() {
  const { phase, maxQualifiers, cars } = await getFixtureData();

  return (
    <main className="min-h-screen flex flex-col">
      <div className="bg-ink px-4 py-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/"
            className="flex items-center gap-1 text-white/50 text-sm hover:text-white transition-colors mb-4"
          >
            <ChevronLeft size={16} />
            Inicio
          </Link>
          <h1 className="font-display text-4xl text-white leading-none mb-4">
            EL FIXTURE
          </h1>
          <PhaseBar phase={phase} />
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <FixtureView
            phase={phase}
            tournamentCars={cars}
            maxQualifiers={maxQualifiers}
          />
        </div>
      </div>

      <footer className="px-4 py-6 text-center">
        <p className="text-xs text-muted">
          Mundial de Clavos 2026 · por{" "}
          <a
            href="https://x.com/emipanelli"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rust underline"
          >
            @emipanelli
          </a>
        </p>
      </footer>
    </main>
  );
}
