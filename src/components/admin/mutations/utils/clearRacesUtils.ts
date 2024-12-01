import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';

export const getRacesForDate = async (startDate: Date, endDate: Date) => {
  console.log('UK time range:', {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  });

  const { data: races, error: racesError } = await supabase
    .from("races")
    .select("id")
    .gte('off_time', startDate.toISOString())
    .lte('off_time', endDate.toISOString());

  if (racesError) {
    console.error("Error fetching races:", racesError);
    throw racesError;
  }

  if (!races || races.length === 0) {
    console.log("No races found for the selected date");
    return [];
  }

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