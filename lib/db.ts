import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";

export const IS_CONFIGURED = connectionString.length > 0;

export const sql = IS_CONFIGURED ? neon(connectionString) : null;

export type TournamentPhase =
  | "eliminatorias"
  | "grupos"
  | "octavos"
  | "cuartos"
  | "semifinal"
  | "final"
  | "terminado";

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
}
