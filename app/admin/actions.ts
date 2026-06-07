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

// Renombra todas las apariciones de un auto. Sirve para corregir errores
// y fusionar duplicados (ej: "Rover75" → "Rover 75").
export async function renameCar(oldName: string, newName: string) {
  if (!sql) throw new Error("Base de datos no configurada.");
  const clean = newName.trim();
  if (!clean) throw new Error("El nombre no puede estar vacío.");
  await sql`
    UPDATE nomination_cars SET car_name = ${clean} WHERE car_name = ${oldName}
  `;
  revalidatePath("/admin");
  revalidatePath("/");
}
