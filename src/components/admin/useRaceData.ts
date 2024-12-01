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
        .select('horse_id, race_id, created_at')
        .in('horse_id', horseIds);

      if (error) {
        console.error('Error fetching existing results:', error);
        throw error;
      }

      console.log('Found existing results:', data);
      return data;
    },
    enabled: horseIds.length > 0,
    // Reduce stale time to ensure more frequent updates
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
          created_at,
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
    // Reduce stale time to ensure more frequent updates
    staleTime: 1000,
  });

  // Helper functions to check data existence
  const hasImportedResults = (race: Race) => {
    if (!race.runners?.length || !existingResults) {
      console.log(`No runners or results for race at ${race.course}`);
      return false;
    }
    const hasAll = race.runners.every(runner => 
      existingResults.some(result => result.horse_id === runner.horse_id)
    );
    console.log(`Race ${race.course} has all results: ${hasAll}`);
    return hasAll;
  };

  const hasImportedAnalysis = (race: Race) => {
    if (!race.runners?.length || !existingAnalysis) {
      console.log(`No runners or analysis for race at ${race.course}`);
      return false;
    }
    const hasAll = race.runners.every(runner => 
      existingAnalysis.some(analysis => 
        analysis.horse_id === runner.horse_id && 
        analysis.horse_distance_details?.length > 0
      )
    );
    console.log(`Race ${race.course} has all analysis: ${hasAll}`);
    return hasAll;
  };

  const getImportedResultsCount = (race: Race) => {
    if (!race.runners?.length || !existingResults) {
      console.log(`No runners or results to count for race at ${race.course}`);
      return 0;
    }
    const count = race.runners.filter(runner => 
      existingResults.some(result => result.horse_id === runner.horse_id)
    ).length;
    console.log(`Race ${race.course} has ${count}/${race.runners.length} results imported`);
    return count;
  };

  const getImportedAnalysisCount = (race: Race) => {
    if (!race.runners?.length || !existingAnalysis) {
      console.log(`No runners or analysis to count for race at ${race.course}`);
      return 0;
    }
    const count = race.runners.filter(runner => 
      existingAnalysis.some(analysis => 
        analysis.horse_id === runner.horse_id && 
        analysis.horse_distance_details?.length > 0
      )
    ).length;
    console.log(`Race ${race.course} has ${count}/${race.runners.length} analysis imported`);
    return count;
  };

  return {
    hasImportedResults,
    hasImportedAnalysis,
    existingResults,
    existingAnalysis,
    getImportedResultsCount,
    getImportedAnalysisCount,
  };
};