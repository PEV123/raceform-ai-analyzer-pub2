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
        .select('horse_id, race_id')
        .in('horse_id', horseIds);

      if (error) {
        console.error('Error fetching existing results:', error);
        throw error;
      }

      console.log('Found existing results:', data);
      return data;
    },
    enabled: horseIds.length > 0,
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
  });

  const hasImportedResults = (race: Race) => {
    if (!race.runners?.length || !existingResults) {
      console.log('No runners or existing results for race:', race.id);
      return false;
    }

    const raceHorseIds = race.runners.map(runner => runner.horse_id);
    console.log('Checking results for race:', {
      raceId: race.id,
      raceHorseIds,
      existingResults
    });

    const hasAllResults = race.runners.every(runner => 
      existingResults.some(result => result.horse_id === runner.horse_id)
    );

    console.log(`Race ${race.id} has${hasAllResults ? '' : ' not'} imported all results`);
    return hasAllResults;
  };

  const hasImportedAnalysis = (race: Race) => {
    if (!race.runners?.length || !existingAnalysis) {
      console.log('No runners or existing analysis for race:', race.id);
      return false;
    }

    const raceHorseIds = race.runners.map(runner => runner.horse_id);
    console.log('Checking analysis for race:', {
      raceId: race.id,
      raceHorseIds,
      existingAnalysis
    });

    const hasAllAnalysis = race.runners.every(runner => 
      existingAnalysis.some(analysis => 
        analysis.horse_id === runner.horse_id && 
        analysis.horse_distance_details?.length > 0
      )
    );

    console.log(`Race ${race.id} has${hasAllAnalysis ? '' : ' not'} imported all analysis`);
    return hasAllAnalysis;
  };

  return {
    hasImportedResults,
    hasImportedAnalysis,
    existingResults,
    existingAnalysis,
  };
};