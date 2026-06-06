"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { TournamentPhase } from "@/lib/supabase";

export async function updateTournamentConfig({
  phase,
  maxQualifiers,
  nominationsOpen,
}: {
  phase: TournamentPhase;
  maxQualifiers: number;
  nominationsOpen: boolean;
}) {
  const { error } = await supabase
    .from("tournament_config")
    .update({ phase, max_qualifiers: maxQualifiers, nominations_open: nominationsOpen })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/fixture");
  revalidatePath("/nominaciones");
  revalidatePath("/admin");
}
