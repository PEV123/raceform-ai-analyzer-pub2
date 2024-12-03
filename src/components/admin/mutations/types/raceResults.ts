import { Tables } from "@/integrations/supabase/types";

export type Race = Tables<"races"> & {
  race_documents: Tables<"race_documents">[];
  runners: Tables<"runners">[];
};

export interface RaceResultsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface RaceResultsParams {
  raceId: string;
}

export interface MoveRaceParams {
  p_race_id: string;
}

export interface MoveRaceResponse {
  success: boolean;
}