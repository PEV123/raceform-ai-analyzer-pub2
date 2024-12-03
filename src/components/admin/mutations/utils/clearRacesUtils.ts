import { supabase } from "@/integrations/supabase/client";

export const getRacesForDate = async (startDate: string, endDate: string) => {
  console.log('Querying races between:', {
    start: startDate,
    end: endDate
  });

  const { data: races, error: racesError } = await supabase
    .from("races")
    .select("id")
    .gte('off_time', startDate)
    .lt('off_time', endDate);

  if (racesError) {
    console.error("Error fetching races:", racesError);
    throw racesError;
  }

  if (!races || races.length === 0) {
    console.log("No races found for the selected date range");
    return [];
  }

  console.log(`Found ${races.length} races to clear in date range`);
  return races.map(race => race.id);
};

export const clearRaceChats = async (raceIds: string[]) => {
  const { error: chatsError } = await supabase
    .from("race_chats")
    .delete()
    .in("race_id", raceIds);
  
  if (chatsError) {
    console.error("Error clearing race chats:", chatsError);
    throw chatsError;
  }
  console.log("Successfully cleared race chats");
};

export const clearRaceDocuments = async (raceIds: string[]) => {
  const { error: docsError } = await supabase
    .from("race_documents")
    .delete()
    .in("race_id", raceIds);
  
  if (docsError) {
    console.error("Error clearing race documents:", docsError);
    throw docsError;
  }
  console.log("Successfully cleared race documents");
};

export const clearRunners = async (raceIds: string[]) => {
  // First get all runner IDs for the races
  const { data: runners, error: runnersQueryError } = await supabase
    .from("runners")
    .select("id")
    .in("race_id", raceIds);

  if (runnersQueryError) {
    console.error("Error fetching runners:", runnersQueryError);
    throw runnersQueryError;
  }

  if (runners && runners.length > 0) {
    const runnerIds = runners.map(runner => runner.id);
    console.log(`Found ${runnerIds.length} runners to clear`);

    // First clear odds history for these runners
    const { error: oddsError } = await supabase
      .from("odds_history")
      .delete()
      .in("runner_id", runnerIds);

    if (oddsError) {
      console.error("Error clearing odds history:", oddsError);
      throw oddsError;
    }
    console.log("Successfully cleared odds history");
  }

  // Now we can safely delete the runners
  const { error: runnersError } = await supabase
    .from("runners")
    .delete()
    .in("race_id", raceIds);
  
  if (runnersError) {
    console.error("Error clearing runners:", runnersError);
    throw runnersError;
  }
  console.log("Successfully cleared runners");
};

export const clearRaces = async (raceIds: string[]) => {
  const { error: deleteRacesError } = await supabase
    .from("races")
    .delete()
    .in("id", raceIds);
  
  if (deleteRacesError) {
    console.error("Error clearing races:", deleteRacesError);
    throw deleteRacesError;
  }
  console.log("Successfully cleared races");
};