import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { fetchRacesForDate } from "@/services/racingApi";

export const useImportRacesMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: Date) => {
      const races = await fetchRacesForDate(date);
      console.log("Importing races for date:", date, races);

      for (const race of races) {
        console.log(`Processing race at ${race.course} - ${race.off_dt}`);

        const { data: raceData, error: raceError } = await supabase
          .from("races")
          .insert({
            off_time: race.off_dt,
            course: race.course,
            race_name: race.race_name,
            region: race.region,
            race_class: race.race_class,
            age_band: race.age_band,
            rating_band: race.rating_band,
            prize: race.prize,
            field_size: Number(race.field_size),
            race_id: race.race_id,
            course_id: race.course_id,
            distance_round: race.distance_round,
            distance: race.distance,
            distance_f: race.distance_f,
            pattern: race.pattern,
            type: race.type,
            going_detailed: race.going_detailed,
            rail_movements: race.rail_movements,
            stalls: race.stalls,
            weather: race.weather,
            going: race.going,
            surface: race.surface,
            jumps: race.jumps,
            big_race: race.big_race,
            is_abandoned: race.is_abandoned,
          })
          .select()
          .single();

        if (raceError) {
          console.error("Error inserting race:", raceError);
          throw raceError;
        }

        console.log(`Successfully inserted race: ${raceData.id}`);

        const validRunners = race.runners
          .filter(runner => {
            const missingFields = [];
            if (!runner.horse_id) missingFields.push('horse_id');
            if (!runner.horse) missingFields.push('horse');
            if (!runner.sire) missingFields.push('sire');
            if (!runner.sire_region) missingFields.push('sire_region');
            if (!runner.dam) missingFields.push('dam');
            if (!runner.dam_region) missingFields.push('dam_region');
            if (!runner.trainer) missingFields.push('trainer');

            const isValid = runner.horse_id && 
                          runner.horse && 
                          runner.sire && 
                          runner.sire_region && 
                          runner.dam && 
                          runner.dam_region && 
                          runner.trainer;
            
            if (!isValid) {
              console.warn(`Skipping runner ${runner.horse} due to missing fields:`, missingFields);
            }
            return isValid;
          })
          .map(runner => ({
            race_id: raceData.id,
            horse_id: runner.horse_id,
            number: Number(runner.number) || 0,
            draw: Number(runner.draw) || 0,
            horse: runner.horse,
            silk_url: runner.silk_url,
            sire: runner.sire,
            sire_region: runner.sire_region,
            dam: runner.dam,
            dam_region: runner.dam_region,
            form: runner.form,
            lbs: Number(runner.lbs) || 0,
            headgear: runner.headgear,
            ofr: runner.ofr,
            ts: runner.ts,
            jockey: runner.jockey || 'Unknown',
            trainer: runner.trainer,
            dob: runner.dob,
            age: runner.age,
            sex: runner.sex,
            sex_code: runner.sex_code,
            colour: runner.colour,
            region: runner.region,
            breeder: runner.breeder,
            dam_id: runner.dam_id,
            damsire: runner.damsire,
            damsire_id: runner.damsire_id,
            damsire_region: runner.damsire_region,
            trainer_id: runner.trainer_id,
            trainer_location: runner.trainer_location,
            trainer_14_days: runner.trainer_14_days,
            owner: runner.owner,
            owner_id: runner.owner_id,
            prev_trainers: runner.prev_trainers,
            prev_owners: runner.prev_owners,
            comment: runner.comment,
            spotlight: runner.spotlight,
            quotes: runner.quotes,
            stable_tour: runner.stable_tour,
            medical: runner.medical,
            headgear_run: runner.headgear_run,
            wind_surgery: runner.wind_surgery,
            wind_surgery_run: runner.wind_surgery_run,
            past_results_flags: runner.past_results_flags,
            rpr: runner.rpr,
            jockey_id: runner.jockey_id,
            last_run: runner.last_run,
            trainer_rtf: runner.trainer_rtf,
            odds: runner.odds,
          }));

        console.log(`Processing ${validRunners.length} valid runners for race ${raceData.id}`);

        if (validRunners.length > 0) {
          const { error: runnersError } = await supabase
            .from("runners")
            .insert(validRunners);

          if (runnersError) {
            console.error("Error inserting runners:", runnersError);
            throw runnersError;
          }
          console.log(`Successfully inserted ${validRunners.length} runners`);
        }
      }
    },
    onSuccess: () => {
      console.log("Successfully imported races and runners");
      toast({
        title: "Success",
        description: "Races and runners have been imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error) => {
      console.error("Error importing races:", error);
      toast({
        title: "Error",
        description: "Failed to import races. Please try again.",
        variant: "destructive",
      });
    },
  });
};