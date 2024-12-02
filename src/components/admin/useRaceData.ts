import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Race = Tables<"races"> & {
  runners: Tables<"runners">[];
};

export const useRaceData = (races: Race[]) => {
  // Get all unique horse IDs from all races
  const horseIds = races.flatMap(race => race.runners?.map(runner => runner.horse_id) || []);

  // Query to check for existing horse results
  const { data: existingResults } = useQuery({
    queryKey: ["existingHorseResults", horseIds],
    queryFn: async () => {
      if (horseIds.length === 0) {
        console.log('No horse IDs to check for results');
        return [];
      }
      
      console.log('Checking existing results for horses:', horseIds);
      
      const { data, error } = await supabase
        .from('horse_results')
        .select('horse_id')
        .in('horse_id', horseIds);

      if (error) {
        console.error('Error fetching existing results:', error);
        throw error;
      }

      console.log('Found existing results:', data);
      return data;
    },
    enabled: horseIds.length > 0,
    staleTime: 1000,
  });

  // Query to check for existing distance analysis
  const { data: existingAnalysis } = useQuery({
    queryKey: ["existingDistanceAnalysis", horseIds],
    queryFn: async () => {
      if (horseIds.length === 0) {
        console.log('No horse IDs to check for analysis');
        return [];
      }
      
      console.log('Checking existing analysis for horses:', horseIds);
      
      const { data, error } = await supabase
        .from('horse_distance_analysis')
        .select(`
          id,
          horse_id,
          horse_distance_details (
            id
          )
        `)
        .in('horse_id', horseIds);

      if (error) {
        console.error('Error fetching existing analysis:', error);
        throw error;
      }

      console.log('Found existing analysis:', data);
      return data;
    },
    enabled: horseIds.length > 0,
    staleTime: 1000,
  });

  // Helper functions to check data existence
  const hasImportedResults = (race: Race) => {
    if (!race.runners?.length || !existingResults) {
      console.log(`No runners or results for race at ${race.course}`);
      return false;
    }

    const raceHorseIds = race.runners.map(runner => runner.horse_id);
    const importedHorseIds = existingResults.map(result => result.horse_id);
    
    const hasAll = raceHorseIds.every(horseId => 
      importedHorseIds.includes(horseId)
    );
    
    console.log(`Race ${race.course} has all results:`, hasAll, {
      raceHorseIds,
      importedHorseIds
    });
    
    return hasAll;
  };

  const hasImportedAnalysis = (race: Race) => {
    if (!race.runners?.length || !existingAnalysis) {
      console.log(`No runners or analysis for race at ${race.course}`);
      return false;
    }

    const raceHorseIds = race.runners.map(runner => runner.horse_id);
    const analyzedHorseIds = existingAnalysis.map(analysis => analysis.horse_id);
    
    const hasAll = raceHorseIds.every(horseId => 
      analyzedHorseIds.includes(horseId)
    );
    
    console.log(`Race ${race.course} has all analysis:`, hasAll, {
      raceHorseIds,
      analyzedHorseIds
    });
    
    return hasAll;
  };

  return {
    hasImportedResults,
    hasImportedAnalysis,
    existingResults,
    existingAnalysis,
  };
};