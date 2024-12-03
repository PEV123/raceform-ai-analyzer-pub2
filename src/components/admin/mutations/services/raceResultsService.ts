import { supabase } from "@/integrations/supabase/client";
import { Race, RaceResultsParams, RaceResultsResponse, MoveRaceParams, MoveRaceResponse } from "../types/raceResults";

export const importRaceResults = async (race: Race): Promise<Race> => {
  if (!race.race_id) {
    console.error('No race_id found for race:', race);
    throw new Error('Race ID is required for importing results');
  }

  console.log('=== START: Import Race Results ===');
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

  console.log('=== SUCCESS: Race Results Import ===');
  console.log('Results data structure:', {
    hasData: !!data,
    dataType: typeof data,
    dataKeys: data ? Object.keys(data) : 'no data'
  });

  console.log('=== START: Move Race to Historical ===');
  console.log('Moving race with ID:', race.id);

  try {
    const { data: moveData, error: moveError } = await supabase
      .rpc<MoveRaceResponse, MoveRaceParams>('move_race_to_historical', {
        p_race_id: race.id
      });

    if (moveError) {
      console.error('=== ERROR: Move Race Failed ===');
      console.error('Move race error details:', {
        error: moveError,
        errorMessage: moveError.message,
        errorCode: moveError.code,
        params: { p_race_id: race.id }
      });
      throw moveError;
    }

    console.log('=== SUCCESS: Move Race Complete ===');
    console.log('Move operation result:', {
      success: moveData?.success,
      raceId: race.id,
      raceApiId: race.race_id,
      course: race.course
    });

    return race;
  } catch (error) {
    console.error('=== ERROR: Unexpected Error in Move Race ===');
    console.error('Caught error details:', {
      error,
      errorType: error instanceof Error ? 'Error object' : typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};