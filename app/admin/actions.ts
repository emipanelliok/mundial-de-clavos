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

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type BuildResult =
  | { ok: true; count: number; numGroups: number }
  | { ok: false; error: string };

// Cierra las clasificaciones y arma los grupos con sistema de bombos (FIFA).
// IRREVERSIBLE en cuanto a las nominaciones, pero re-ejecutable para re-sortear
// mientras la fase de grupos no tenga votos.
export async function buildTournament(): Promise<BuildResult> {
  if (!sql) return { ok: false, error: "Base de datos no configurada." };

  const [config] = await sql`SELECT max_qualifiers FROM tournament_config WHERE id = 1`;
  const maxQ: number = config?.max_qualifiers ?? 32;
  const numGroups = Math.floor(maxQ / 4); // 32→8, 24→6, 16→4

  // Top N autos por votos
  const cars = (await sql`
    SELECT car_name, count(*)::int AS votes
    FROM nomination_cars
    GROUP BY car_name
    ORDER BY votes DESC, car_name ASC
    LIMIT ${maxQ}
  `) as { car_name: string; votes: number }[];

  if (cars.length < maxQ) {
    return {
      ok: false,
      error: `Solo hay ${cars.length} autos votados, necesitás ${maxQ} para armar ${numGroups} grupos de 4. Bajá "clasifican al mundial" en Configuración (a ${cars.length >= 24 ? 24 : cars.length >= 16 ? 16 : "un número menor"}) y reintentá.`,
    };
  }

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H"].slice(0, numGroups);

  // Repartir por bombos: cada bombo (numGroups autos) se sortea entre los grupos
  const rows: { car_name: string; votes: number; seed: number; group: string; pos: number }[] = [];
  for (let b = 0; b < 4; b++) {
    const pot = cars.slice(b * numGroups, (b + 1) * numGroups);
    const shuffled = shuffle(groups);
    pot.forEach((car, i) => {
      rows.push({
        car_name: car.car_name,
        votes: car.votes,
        seed: b * numGroups + i + 1,
        group: shuffled[i],
        pos: b + 1,
      });
    });
  }

  // Reset limpio (orden importa por foreign keys)
  await sql`DELETE FROM match_votes`;
  await sql`DELETE FROM matches`;
  await sql`DELETE FROM tournament_cars`;

  for (const r of rows) {
    await sql`
      INSERT INTO tournament_cars (car_name, total_nominations, seed, group_letter, group_position)
      VALUES (${r.car_name}, ${r.votes}, ${r.seed}, ${r.group}, ${r.pos})
    `;
  }

  await sql`UPDATE tournament_config SET phase = 'grupos', nominations_open = false WHERE id = 1`;

  revalidatePath("/");
  revalidatePath("/fixture");
  revalidatePath("/admin");

  return { ok: true, count: rows.length, numGroups };
}

// Vuelve a la fase de clasificaciones (deshace el armado). Reabre nominaciones.
export async function reopenClassification() {
  if (!sql) throw new Error("Base de datos no configurada.");
  await sql`DELETE FROM match_votes`;
  await sql`DELETE FROM matches`;
  await sql`DELETE FROM tournament_cars`;
  await sql`UPDATE tournament_config SET phase = 'eliminatorias', nominations_open = true WHERE id = 1`;
  revalidatePath("/");
  revalidatePath("/fixture");
  revalidatePath("/admin");
}
