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

// ─── Torneo eliminatorio ────────────────────────────────────────────────────────

const NEXT_PHASE: Record<string, string> = {
  octavos: "cuartos",
  cuartos: "semifinal",
  semifinal: "final",
  final: "terminado",
};

// Cruces de octavos (grupo, posición) — estándar FIFA, coincide con Bracket.tsx
const R16_CROSSES: [[string, number], [string, number]][] = [
  [["A", 1], ["B", 2]], // M1
  [["C", 1], ["D", 2]], // M2
  [["E", 1], ["F", 2]], // M3
  [["G", 1], ["H", 2]], // M4
  [["B", 1], ["A", 2]], // M5
  [["D", 1], ["C", 2]], // M6
  [["F", 1], ["E", 2]], // M7
  [["H", 1], ["G", 2]], // M8
];

export type AdvanceResult = { ok: true; phase: string; matches: number } | { ok: false; error: string };

// Cierra la ronda actual y genera la siguiente.
export async function advanceRound(): Promise<AdvanceResult> {
  if (!sql) return { ok: false, error: "Base de datos no configurada." };

  const [config] = await sql`SELECT phase FROM tournament_config WHERE id = 1`;
  const phase: string = config?.phase ?? "";

  // ── grupos → octavos ──
  if (phase === "grupos") {
    const ranked = (await sql`
      SELECT tc.id, tc.group_letter,
        row_number() OVER (
          PARTITION BY tc.group_letter
          ORDER BY count(gv.id) DESC, tc.total_nominations DESC, tc.seed ASC
        ) AS rk
      FROM tournament_cars tc
      LEFT JOIN group_votes gv ON gv.tournament_car_id = tc.id
      WHERE tc.group_letter IS NOT NULL
      GROUP BY tc.id, tc.group_letter, tc.total_nominations, tc.seed
    `) as { id: string; group_letter: string; rk: number }[];

    const pick = new Map<string, string>(); // `${group}${pos}` -> car_id
    for (const r of ranked) if (r.rk <= 2) pick.set(`${r.group_letter}${r.rk}`, r.id);

    if (pick.size < 16)
      return { ok: false, error: "Faltan clasificados para armar octavos. ¿Se votaron todos los grupos?" };

    await sql`DELETE FROM match_votes`;
    await sql`DELETE FROM matches`;

    let n = 1;
    for (const [[ga, pa], [gb, pb]] of R16_CROSSES) {
      const c1 = pick.get(`${ga}${pa}`);
      const c2 = pick.get(`${gb}${pb}`);
      await sql`
        INSERT INTO matches (phase, match_number, car1_id, car2_id, is_active)
        VALUES ('octavos', ${n}, ${c1}, ${c2}, true)
      `;
      n++;
    }
    await sql`UPDATE tournament_config SET phase = 'octavos' WHERE id = 1`;
    revalidatePath("/"); revalidatePath("/fixture"); revalidatePath("/votar"); revalidatePath("/admin");
    return { ok: true, phase: "octavos", matches: 8 };
  }

  // ── octavos/cuartos/semifinal → siguiente · final → terminado ──
  if (phase in NEXT_PHASE) {
    const next = NEXT_PHASE[phase];

    // Cerrar ronda actual: calcular votos y ganador de cada partido
    const matches = (await sql`
      SELECT m.id, m.match_number, m.car1_id, m.car2_id,
        (SELECT count(*)::int FROM match_votes WHERE match_id = m.id AND voted_car_id = m.car1_id) AS v1,
        (SELECT count(*)::int FROM match_votes WHERE match_id = m.id AND voted_car_id = m.car2_id) AS v2
      FROM matches m WHERE m.phase = ${phase} ORDER BY m.match_number ASC
    `) as { id: string; match_number: number; car1_id: string; car2_id: string; v1: number; v2: number }[];

    const winners: string[] = [];
    for (const m of matches) {
      // ganador por votos; empate → car1 (cabeza de serie / mejor sembrado)
      const winner = m.v2 > m.v1 ? m.car2_id : m.car1_id;
      winners.push(winner);
      await sql`
        UPDATE matches SET car1_votes = ${m.v1}, car2_votes = ${m.v2}, winner_id = ${winner}, is_active = false
        WHERE id = ${m.id}
      `;
    }

    if (next === "terminado") {
      await sql`UPDATE tournament_config SET phase = 'terminado' WHERE id = 1`;
      revalidatePath("/"); revalidatePath("/fixture"); revalidatePath("/votar"); revalidatePath("/admin");
      return { ok: true, phase: "terminado", matches: 0 };
    }

    // Crear siguiente ronda emparejando ganadores consecutivos
    let n = 1;
    for (let i = 0; i < winners.length; i += 2) {
      await sql`
        INSERT INTO matches (phase, match_number, car1_id, car2_id, is_active)
        VALUES (${next}, ${n}, ${winners[i]}, ${winners[i + 1]}, true)
      `;
      n++;
    }
    await sql`UPDATE tournament_config SET phase = ${next} WHERE id = 1`;
    revalidatePath("/"); revalidatePath("/fixture"); revalidatePath("/votar"); revalidatePath("/admin");
    return { ok: true, phase: next, matches: Math.floor(winners.length / 2) };
  }

  return { ok: false, error: `No se puede avanzar desde la fase "${phase}".` };
}

// Setea la foto de un auto
export async function setCarImage(carId: string, imageUrl: string) {
  if (!sql) throw new Error("Base de datos no configurada.");
  const clean = imageUrl.trim() || null;
  await sql`UPDATE tournament_cars SET image_url = ${clean} WHERE id = ${carId}`;
  revalidatePath("/"); revalidatePath("/fixture"); revalidatePath("/votar"); revalidatePath("/admin");
}

// Reemplaza uno de los dos autos de un partido (corrige errores / duplicados).
// Borra los votos del partido para que arranque limpio.
export async function setMatchCar(matchId: string, slot: 1 | 2, carId: string) {
  if (!sql) throw new Error("Base de datos no configurada.");
  if (slot === 1) {
    await sql`UPDATE matches SET car1_id = ${carId}, car1_votes = 0, winner_id = NULL WHERE id = ${matchId}`;
  } else {
    await sql`UPDATE matches SET car2_id = ${carId}, car2_votes = 0, winner_id = NULL WHERE id = ${matchId}`;
  }
  await sql`DELETE FROM match_votes WHERE match_id = ${matchId}`;
  revalidatePath("/"); revalidatePath("/fixture"); revalidatePath("/votar"); revalidatePath("/admin");
}
