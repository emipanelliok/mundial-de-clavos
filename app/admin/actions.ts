"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TournamentPhase } from "@/lib/db";

export async function updateTournamentConfig({
  phase,
  maxQualifiers,
  nominationsOpen,
}: {
  phase: TournamentPhase;
  maxQualifiers: number;
  nominationsOpen: boolean;
}) {
  if (!sql) throw new Error("Base de datos no configurada.");

  await sql`
    UPDATE tournament_config
    SET phase = ${phase},
        max_qualifiers = ${maxQualifiers},
        nominations_open = ${nominationsOpen}
    WHERE id = 1
  `;

  revalidatePath("/");
  revalidatePath("/fixture");
  revalidatePath("/nominaciones");
  revalidatePath("/admin");
}
