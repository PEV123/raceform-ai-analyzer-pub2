import { supabase } from "@/integrations/supabase/client";

export const checkExistingRace = async (raceId: string) => {
  const { data: existingRaces, error: queryError } = await supabase
    .from("races")
    .select("id")
    .eq("race_id", raceId);

  if (queryError) {
    console.error("Error checking existing race:", queryError);
    throw queryError;
  }

  return existingRaces?.[0];
};

export const insertRace = async (raceData: any) => {
  const { data, error: raceError } = await supabase
    .from("races")
    .insert(raceData)
    .select();

  if (raceError) {
    console.error("Error inserting race:", raceError);
    throw raceError;
  }

  if (!data || data.length === 0) {
    console.error("No race data returned after insert");
    throw new Error("Failed to create race");
  }

  console.log('Successfully inserted race:', data[0]);
  return data[0];
};