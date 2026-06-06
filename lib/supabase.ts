import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const IS_CONFIGURED =
  supabaseUrl !== "https://placeholder.supabase.co" &&
  supabaseAnonKey !== "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TournamentPhase =
  | "eliminatorias"
  | "grupos"
  | "octavos"
  | "cuartos"
  | "semifinal"
  | "final"
  | "terminado";

export interface TournamentConfig {
  id: number;
  phase: TournamentPhase;
  max_qualifiers: number;
  nominations_open: boolean;
}

export interface Nomination {
  id: string;
  twitter_handle: string;
  created_at: string;
}

export interface NominationCar {
  id: string;
  nomination_id: string;
  car_name: string;
  reference_car_id: string | null;
}

export interface CarCount {
  car_name: string;
  total_nominations: number;
}

export interface TournamentCar {
  id: string;
  car_name: string;
  image_url: string | null;
  total_nominations: number;
  seed: number | null;
  group_letter: string | null;
  group_position: number | null;
}

export interface Match {
  id: string;
  phase: string;
  group_letter: string | null;
  match_number: number | null;
  car1_id: string | null;
  car2_id: string | null;
  car1_votes: number;
  car2_votes: number;
  winner_id: string | null;
  is_active: boolean;
  car1?: TournamentCar;
  car2?: TournamentCar;
  winner?: TournamentCar;
}
