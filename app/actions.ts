"use server";

import { sql, IS_CONFIGURED } from "@/lib/db";
import { headers } from "next/headers";

export type NominationResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function submitNomination(
  twitterHandle: string,
  cars: string[],
  email?: string
): Promise<NominationResult> {
  const handle = twitterHandle.replace(/^@/, "").trim().toLowerCase();

  if (!handle) return { success: false, error: "Ingresá tu usuario de Twitter." };
  if (cars.length === 0) return { success: false, error: "Clasificá al menos 1 auto." };
  if (cars.length > 5) return { success: false, error: "Podés clasificar hasta 5 autos." };

  const uniqueCars = [...new Set(cars.map((c) => c.trim()).filter(Boolean))];
  if (uniqueCars.length !== cars.length)
    return { success: false, error: "No podés nominar el mismo auto dos veces." };

  // Email opcional — solo validamos formato si lo cargaron
  const cleanEmail = email?.trim().toLowerCase() || null;
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return { success: false, error: "El email no parece válido. Dejalo vacío o corregilo." };

  if (!IS_CONFIGURED || !sql)
    return { success: false, error: "Base de datos no configurada." };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const [config] = await sql`SELECT nominations_open FROM tournament_config WHERE id = 1`;
    if (!config?.nominations_open)
      return { success: false, error: "Las nominaciones están cerradas." };

    const [existing] = await sql`
      SELECT id FROM nominations WHERE twitter_handle = ${handle} LIMIT 1
    `;
    if (existing)
      return { success: false, error: `@${handle} ya nominó. Solo se puede votar una vez.` };

    // Atómico: inserta nominación + autos en un solo statement (sin huérfanos)
    await sql`
      WITH new_nom AS (
        INSERT INTO nominations (twitter_handle, ip_address, email)
        VALUES (${handle}, ${ip}, ${cleanEmail})
        RETURNING id
      )
      INSERT INTO nomination_cars (nomination_id, car_name)
      SELECT new_nom.id, unnest(${uniqueCars}::text[]) FROM new_nom
    `;

    return {
      success: true,
      message: `¡Listo @${handle}! Tus ${uniqueCars.length} clavo${uniqueCars.length > 1 ? "s" : ""} están clasificados al Mundial.`,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("23505"))
      return { success: false, error: `@${handle} ya nominó. Solo se puede votar una vez.` };
    return { success: false, error: "Error al guardar. Intentá de nuevo." };
  }
}

// Returns: "valid" | "invalid" | "unknown"
// "valid" = format ok + network confirmed exists
// "invalid" = bad format OR definitive 404 from X
// "unknown" = format ok but network blocked/timeout (allow through)
export async function checkTwitterHandle(
  handle: string
): Promise<"valid" | "invalid" | "unknown"> {
  const clean = handle.replace(/^@/, "").trim().toLowerCase();

  // Format check: 1–15 chars, alphanumeric + underscore only
  if (!clean || !/^[a-z0-9_]{1,15}$/.test(clean)) return "invalid";

  try {
    // Use the public intent URL — more reliable for server-side checks
    const res = await fetch(
      `https://twitter.com/intent/user?screen_name=${clean}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(5000),
        redirect: "follow",
      }
    );

    if (res.status === 404) return "invalid";
    if (res.ok) return "valid";
    // 403, 429, etc. = blocked, don't punish the user
    return "unknown";
  } catch {
    return "unknown";
  }
}

export async function getTopNominations(limit = 20) {
  if (!IS_CONFIGURED || !sql) return [];
  try {
    return await sql`
      SELECT car_name, count(*)::int AS total_nominations
      FROM nomination_cars
      GROUP BY car_name
      ORDER BY total_nominations DESC
      LIMIT ${limit}
    `;
  } catch {
    return [];
  }
}

export async function getRandomContenders(limit = 6) {
  if (!IS_CONFIGURED || !sql) return { cars: [] as string[], total: 0 };
  try {
    const [result, [countRow]] = await Promise.all([
      sql`
        SELECT car_name FROM nomination_cars
        GROUP BY car_name
        ORDER BY random()
        LIMIT ${limit}
      `,
      sql`SELECT count(distinct car_name)::int AS n FROM nomination_cars`,
    ]);
    return { cars: (result ?? []).map((r) => (r as { car_name: string }).car_name), total: countRow?.n ?? 0 };
  } catch {
    return { cars: [] as string[], total: 0 };
  }
}

export async function getTournamentStats() {
  if (!IS_CONFIGURED || !sql) {
    return { totalVoters: 0, totalNominations: 0, phase: "eliminatorias", maxQualifiers: 32, nominationsOpen: true, phaseEndsAt: null };
  }
  try {
    const [[voters], [nominations], [config]] = await Promise.all([
      sql`SELECT count(*)::int AS n FROM nominations`,
      sql`SELECT count(*)::int AS n FROM nomination_cars`,
      sql`SELECT phase, max_qualifiers, nominations_open, phase_ends_at FROM tournament_config WHERE id = 1`,
    ]);
    return {
      totalVoters: voters?.n ?? 0,
      totalNominations: nominations?.n ?? 0,
      phase: config?.phase ?? "eliminatorias",
      maxQualifiers: config?.max_qualifiers ?? 32,
      nominationsOpen: config?.nominations_open ?? true,
      phaseEndsAt: config?.phase_ends_at ?? null,
    };
  } catch {
    return { totalVoters: 0, totalNominations: 0, phase: "eliminatorias", maxQualifiers: 32, nominationsOpen: true, phaseEndsAt: null };
  }
}

// ─── Fase de grupos ────────────────────────────────────────────────────────────

export interface VotingGroup {
  letter: string;
  cars: { id: string; car_name: string; total_nominations: number }[];
}

export async function getGroupsForVoting(): Promise<VotingGroup[]> {
  if (!IS_CONFIGURED || !sql) return [];
  try {
    const rows = (await sql`
      SELECT id, car_name, total_nominations, group_letter
      FROM tournament_cars
      WHERE group_letter IS NOT NULL
      ORDER BY group_letter ASC, group_position ASC, seed ASC
    `) as { id: string; car_name: string; total_nominations: number; group_letter: string }[];

    const map = new Map<string, VotingGroup>();
    for (const r of rows) {
      if (!map.has(r.group_letter)) map.set(r.group_letter, { letter: r.group_letter, cars: [] });
      map.get(r.group_letter)!.cars.push({ id: r.id, car_name: r.car_name, total_nominations: r.total_nominations });
    }
    return [...map.values()].sort((a, b) => a.letter.localeCompare(b.letter));
  } catch {
    return [];
  }
}

export async function submitGroupVote(
  twitterHandle: string,
  carIds: string[]
): Promise<NominationResult> {
  const handle = twitterHandle.replace(/^@/, "").trim().toLowerCase();
  if (!handle || !/^[a-z0-9_]{1,15}$/.test(handle))
    return { success: false, error: "Ingresá un usuario de Twitter válido." };

  const ids = [...new Set(carIds.filter(Boolean))];
  if (ids.length === 0) return { success: false, error: "Elegí al menos un auto." };

  if (!IS_CONFIGURED || !sql) return { success: false, error: "Base de datos no configurada." };

  try {
    const [config] = await sql`SELECT phase FROM tournament_config WHERE id = 1`;
    if (config?.phase !== "grupos")
      return { success: false, error: "La votación de grupos no está abierta." };

    // ¿Ya votó esta persona?
    const [existing] = await sql`SELECT 1 FROM group_votes WHERE voter_handle = ${handle} LIMIT 1`;
    if (existing) return { success: false, error: `@${handle} ya votó la fase de grupos.` };

    // Traer los autos elegidos con su grupo, y validar máx 2 por grupo
    const cars = (await sql`
      SELECT id, group_letter FROM tournament_cars WHERE id = ANY(${ids}::uuid[])
    `) as { id: string; group_letter: string }[];

    const perGroup = new Map<string, number>();
    for (const c of cars) perGroup.set(c.group_letter, (perGroup.get(c.group_letter) ?? 0) + 1);
    for (const [, n] of perGroup) {
      if (n > 2) return { success: false, error: "Podés elegir hasta 2 autos por grupo." };
    }

    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    for (const c of cars) {
      await sql`
        INSERT INTO group_votes (voter_handle, tournament_car_id, group_letter, ip_address)
        VALUES (${handle}, ${c.id}, ${c.group_letter}, ${ip})
      `;
    }

    return { success: true, message: `¡Listo @${handle}! Tu voto de la fase de grupos quedó registrado.` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("23505"))
      return { success: false, error: `@${handle} ya votó la fase de grupos.` };
    return { success: false, error: "Error al guardar. Intentá de nuevo." };
  }
}
