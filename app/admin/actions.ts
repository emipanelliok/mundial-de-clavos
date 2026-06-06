"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TournamentPhase } from "@/lib/db";

export async function updateTournamentConfig({
  phase,
  maxQualifiers,
  nominationsOpen,
  phaseEndsAt,
}: {
  phase: TournamentPhase;
  maxQualifiers: number;
  nominationsOpen: boolean;
  phaseEndsAt: string | null;
}) {
  if (!sql) throw new Error("Base de datos no configurada.");

  await sql`
    UPDATE tournament_config
    SET phase = ${phase},
        max_qualifiers = ${maxQualifiers},
        nominations_open = ${nominationsOpen},
        phase_ends_at = ${phaseEndsAt}
    WHERE id = 1
  `;

  revalidatePath("/");
  revalidatePath("/fixture");
  revalidatePath("/nominaciones");
  revalidatePath("/admin");
}

export async function deleteNomination(twitterHandle: string) {
  if (!sql) throw new Error("Base de datos no configurada.");
  await sql`DELETE FROM nominations WHERE twitter_handle = ${twitterHandle.toLowerCase()}`;
  revalidatePath("/admin");
}
