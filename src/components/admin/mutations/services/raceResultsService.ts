import { supabase } from "@/integrations/supabase/client";
import { Race, RaceResultsParams, RaceResultsResponse } from "../types/raceResults";

interface MoveRaceParams {
  p_race_id: string;
}

interface MoveRaceResponse {
  success: boolean;
}

export const importRaceResults = async (race: Race): Promise<Race> => {
  if (!race.race_id) {
    console.error('No race_id found for race:', race);
    throw new Error('Race ID is required for importing results');
  }

  console.log('Importing results for race:', {
    raceId: race.id,
    raceApiId: race.race_id,
    course: race.course
  });

  const { data, error: importError } = await supabase.functions.invoke<RaceResultsResponse>(
    'fetch-race-results',
    {
      body: {
        raceId: race.race_id
      } satisfies RaceResultsParams
    }
  );

  if (importError) {
    console.error('Error importing race results:', importError);
    throw importError;
  }

  console.log('Successfully imported race results:', data);

  // Debug log to check the race.id value
  console.log('Attempting to move race with ID:', race.id);

  try {
    const { data: moveData, error: moveError } = await supabase
      .rpc('move_race_to_historical', {
        p_race_id: race.id
      });

    console.log('Move race response:', { moveData, moveError });

    if (moveError) {
      console.error('Error moving race to historical:', moveError);
      throw moveError;
    }

    console.log('Successfully moved race to historical races:', {
      raceId: race.id,
      raceApiId: race.race_id,
      course: race.course
    });

    return race;
  } catch (error) {
    console.error('Caught error in move_race_to_historical:', error);
    throw error;
  }
};