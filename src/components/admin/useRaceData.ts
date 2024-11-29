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
      if (horseIds.length === 0) return [];
      
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
  });

  // Query to check for existing distance analysis
  const { data: existingAnalysis } = useQuery({
    queryKey: ["existingDistanceAnalysis", horseIds],
    queryFn: async () => {
      if (horseIds.length === 0) return [];
      
      console.log('Checking existing analysis for horses:', horseIds);
      
      const { data, error } = await supabase
        .from('horse_distance_analysis')
        .select('horse_id')
        .in('horse_id', horseIds);

      if (error) {
        console.error('Error fetching existing analysis:', error);
        throw error;
      }

      console.log('Found existing analysis:', data);
      return data;
    },
  });

  const hasImportedResults = (race: Race) => {
    if (!race.runners?.length || !existingResults) return false;
    console.log('Checking results for race:', race.id, 'runners:', race.runners.length, 'existing:', existingResults.length);
    return race.runners.every(runner => 
      existingResults.some(result => result.horse_id === runner.horse_id)
    );
  };

  const hasImportedAnalysis = (race: Race) => {
    if (!race.runners?.length || !existingAnalysis) return false;
    console.log('Checking analysis for race:', race.id, 'runners:', race.runners.length, 'existing:', existingAnalysis.length);
    return race.runners.every(runner => 
      existingAnalysis.some(analysis => analysis.horse_id === runner.horse_id)
    );
  };

  return {
    hasImportedResults,
    hasImportedAnalysis,
    existingResults,
    existingAnalysis,
  };
};