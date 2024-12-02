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

  // Helper functions to check data existence and return counts
  const getImportedResultsCount = (race: Race) => {
    if (!race.runners?.length || !existingResults) {
      console.log(`No runners or results for race at ${race.course}`);
      return 0;
    }

    const raceHorseIds = race.runners.map(runner => runner.horse_id);
    const importedHorseIds = existingResults.map(result => result.horse_id);
    
    const count = raceHorseIds.filter(horseId => 
      importedHorseIds.includes(horseId)
    ).length;
    
    console.log(`Race ${race.course} has ${count}/${race.runners.length} results`, {
      raceHorseIds,
      importedHorseIds
    });
    
    return count;
  };

  const getImportedAnalysisCount = (race: Race) => {
    if (!race.runners?.length || !existingAnalysis) {
      console.log(`No runners or analysis for race at ${race.course}`);
      return 0;
    }

    const raceHorseIds = race.runners.map(runner => runner.horse_id);
    const analyzedHorseIds = existingAnalysis.map(analysis => analysis.horse_id);
    
    const count = raceHorseIds.filter(horseId => 
      analyzedHorseIds.includes(horseId)
    ).length;
    
    console.log(`Race ${race.course} has ${count}/${race.runners.length} analysis`, {
      raceHorseIds,
      analyzedHorseIds
    });
    
    return count;
  };

  // For backward compatibility
  const hasImportedResults = (race: Race) => {
    const count = getImportedResultsCount(race);
    return count === race.runners?.length;
  };

  const hasImportedAnalysis = (race: Race) => {
    const count = getImportedAnalysisCount(race);
    return count === race.runners?.length;
  };

  return {
    hasImportedResults,
    hasImportedAnalysis,
    getImportedResultsCount,
    getImportedAnalysisCount,
    existingResults,
    existingAnalysis,
  };
};