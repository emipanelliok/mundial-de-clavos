"use server";

import { sql, IS_CONFIGURED } from "@/lib/db";
import { headers } from "next/headers";

export type NominationResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function submitNomination(
  twitterHandle: string,
  cars: string[]
): Promise<NominationResult> {
  const handle = twitterHandle.replace(/^@/, "").trim().toLowerCase();

  if (!handle) return { success: false, error: "Ingresá tu usuario de Twitter." };
  if (cars.length === 0) return { success: false, error: "Clasificá al menos 1 auto." };
  if (cars.length > 5) return { success: false, error: "Podés clasificar hasta 5 autos." };

  const uniqueCars = [...new Set(cars.map((c) => c.trim()).filter(Boolean))];
  if (uniqueCars.length !== cars.length)
    return { success: false, error: "No podés nominar el mismo auto dos veces." };

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

    const [nomination] = await sql`
      INSERT INTO nominations (twitter_handle, ip_address)
      VALUES (${handle}, ${ip})
      RETURNING id
    `;

    await sql`
      INSERT INTO nomination_cars (nomination_id, car_name)
      SELECT ${nomination.id}, unnest(${uniqueCars}::text[])
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
