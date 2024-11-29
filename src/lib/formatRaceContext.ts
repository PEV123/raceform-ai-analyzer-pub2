import { supabase } from "@/integrations/supabase/client";

export const formatRaceContext = async (race: any) => {
  if (!race) return "No race data available";

  // Fetch historical results for all runners
  const horseIds = race.runners?.map((runner: any) => runner.horse_id) || [];
  
  // Fetch both historical results and distance analysis
  const [historicalResults, distanceAnalyses] = await Promise.all([
    supabase
      .from('horse_results')
      .select('*')
      .in('horse_id', horseIds)
      .order('date', { ascending: false }),
    supabase
      .from('horse_distance_analysis')
      .select(`
        *,
        horse_distance_details (
          *,
          horse_distance_times (*)
        )
      `)
      .in('horse_id', horseIds)
  ]);

  console.log('Fetched historical results:', historicalResults.data?.length);
  console.log('Fetched distance analyses:', distanceAnalyses.data?.length);

  // Create a structured context object that includes both formatted and raw data
  const raceContext = {
    race_overview: {
      name: race.race_name,
      course: race.course,
      datetime: race.off_time,
      distance: race.distance,
      going: race.going,
      class: race.race_class,
      prize: race.prize,
      surface: race.surface,
      jumps: race.jumps,
      field_size: race.field_size
    },
    runners: race.runners?.map((runner: any) => {
      const horseResults = historicalResults.data?.filter(result => result.horse_id === runner.horse_id) || [];
      const timeAnalysis = distanceAnalyses.data?.find(analysis => analysis.horse_id === runner.horse_id);
      
      return {
        // Basic info
        horse: runner.horse,
        horse_id: runner.horse_id,
        number: runner.number,
        draw: runner.draw,
        weight_lbs: runner.lbs,
        
        // Breeding info
        age: runner.age,
        sex: runner.sex,
        sire: runner.sire,
        sire_region: runner.sire_region,
        dam: runner.dam,
        dam_region: runner.dam_region,
        damsire: runner.damsire,
        breeder: runner.breeder,
        
        // Connections
        jockey: runner.jockey,
        trainer: runner.trainer,
        trainer_location: runner.trainer_location,
        owner: runner.owner,
        
        // Form and ratings
        official_rating: runner.ofr,
        rpr: runner.rpr,
        form: runner.form,
        spotlight: runner.spotlight,
        comment: runner.comment,
        
        // Equipment and medical
        headgear: runner.headgear,
        wind_surgery: runner.wind_surgery,
        medical_history: runner.medical,
        
        // Statistics
        trainer_14_day_stats: runner.trainer_14_days,
        trainer_rtf: runner.trainer_rtf,
        
        // Historical performance
        historical_results: horseResults,
        distance_analysis: timeAnalysis,
        
        // Additional insights
        stable_tour_comments: runner.stable_tour,
        quotes: runner.quotes,
        flags: runner.past_results_flags
      };
    }) || [],
    raw_data: race // Include complete raw data
  };

  console.log('Generated comprehensive race context with enhanced runner details');
  return JSON.stringify(raceContext, null, 2); // Pretty print JSON
};