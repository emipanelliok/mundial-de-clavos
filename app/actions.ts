"use server";

import { supabase, IS_CONFIGURED } from "@/lib/supabase";
import { headers } from "next/headers";

export type NominationResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function submitNomination(
  twitterHandle: string,
  cars: string[]
): Promise<NominationResult> {
  const handle = twitterHandle.replace(/^@/, "").trim().toLowerCase();

  if (!handle) {
    return { success: false, error: "Ingresá tu usuario de Twitter." };
  }

  if (cars.length === 0) {
    return { success: false, error: "Nominá al menos 1 auto." };
  }

  if (cars.length > 5) {
    return { success: false, error: "Podés nominar hasta 5 autos." };
  }

  const uniqueCars = [...new Set(cars.map((c) => c.trim()).filter(Boolean))];
  if (uniqueCars.length !== cars.length) {
    return { success: false, error: "No podés nominar el mismo auto dos veces." };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Check if nominations are open
  const { data: config } = await supabase
    .from("tournament_config")
    .select("nominations_open, phase")
    .single();

  if (!config?.nominations_open) {
    return { success: false, error: "Las nominaciones están cerradas." };
  }

  // Check duplicate twitter handle
  const { data: existing } = await supabase
    .from("nominations")
    .select("id")
    .eq("twitter_handle", handle)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `@${handle} ya nominó. Solo se puede votar una vez.`,
    };
  }

  // Insert nomination
  const { data: nomination, error: nomError } = await supabase
    .from("nominations")
    .insert({ twitter_handle: handle, ip_address: ip })
    .select("id")
    .single();

  if (nomError || !nomination) {
    if (nomError?.code === "23505") {
      return {
        success: false,
        error: `@${handle} ya nominó. Solo se puede votar una vez.`,
      };
    }
    return { success: false, error: "Error al guardar. Intentá de nuevo." };
  }

  // Insert nominated cars
  const carRows = uniqueCars.map((car_name) => ({
    nomination_id: nomination.id,
    car_name,
  }));

  const { error: carsError } = await supabase
    .from("nomination_cars")
    .insert(carRows);

  if (carsError) {
    // Rollback nomination
    await supabase.from("nominations").delete().eq("id", nomination.id);
    return { success: false, error: "Error al guardar los autos. Intentá de nuevo." };
  }

  return {
    success: true,
    message: `¡Listo @${handle}! Tus ${uniqueCars.length} nominado${uniqueCars.length > 1 ? "s" : ""} están registrados.`,
  };
}

export async function getTopNominations(limit = 20) {
  if (!IS_CONFIGURED) return [];
  try {
    const { data } = await supabase
      .from("car_nomination_counts")
      .select("car_name, total_nominations")
      .order("total_nominations", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getTournamentStats() {
  if (!IS_CONFIGURED) {
    return { totalVoters: 0, totalNominations: 0, phase: "eliminatorias", maxQualifiers: 32, nominationsOpen: true };
  }
  try {
    const [{ count: totalVoters }, { count: totalNominations }, { data: config }] =
      await Promise.all([
        supabase.from("nominations").select("*", { count: "exact", head: true }),
        supabase.from("nomination_cars").select("*", { count: "exact", head: true }),
        supabase.from("tournament_config").select("phase, max_qualifiers, nominations_open").single(),
      ]);

    return {
      totalVoters: totalVoters ?? 0,
      totalNominations: totalNominations ?? 0,
      phase: config?.phase ?? "eliminatorias",
      maxQualifiers: config?.max_qualifiers ?? 32,
      nominationsOpen: config?.nominations_open ?? true,
    };
  } catch {
    return {
      totalVoters: 0,
      totalNominations: 0,
      phase: "eliminatorias",
      maxQualifiers: 32,
      nominationsOpen: true,
    };
  }
}
