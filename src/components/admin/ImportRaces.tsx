import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchTodaysRaces } from "@/services/racingApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const ImportRaces = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      const races = await fetchTodaysRaces();
      console.log("Importing races:", races);

      for (const race of races) {
        // Convert time to proper timestamp
        const [hours, minutes] = race.off_time.split(':');
        const today = new Date();
        today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const timestamp = today.toISOString();

        console.log(`Processing race at ${race.course} - ${race.off_time}`);

        // Insert race with properly formatted timestamp
        const { data: raceData, error: raceError } = await supabase
          .from("races")
          .insert([{
            off_time: timestamp,
            course: race.course,
            race_name: race.race_name,
            region: race.region,
            race_class: race.race_class,
            age_band: race.age_band,
            rating_band: race.rating_band,
            prize: race.prize,
            field_size: race.field_size,
          }])
          .select()
          .single();

        if (raceError) {
          console.error("Error inserting race:", raceError);
          throw raceError;
        }

        console.log(`Successfully inserted race: ${raceData.id}`);

        // Transform and validate runners
        const validRunners = race.runners
          .filter(runner => {
            // Log all missing required fields for debugging
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
            number: runner.number || 0,
            draw: runner.draw || 0,
            horse: runner.horse,
            silk_url: runner.silk_url,
            sire: runner.sire,
            sire_region: runner.sire_region,
            dam: runner.dam,
            dam_region: runner.dam_region,
            form: runner.form,
            lbs: runner.lbs || 0,
            headgear: runner.headgear,
            ofr: runner.ofr,
            ts: runner.ts,
            jockey: runner.jockey || 'Unknown',
            trainer: runner.trainer,
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

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Import Races</h2>
      <p className="text-muted-foreground mb-4">
        Import today's races from the Racing API
      </p>
      <Button
        onClick={() => importMutation.mutate()}
        disabled={importMutation.isPending}
      >
        {importMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          "Import Today's Races"
        )}
      </Button>
    </Card>
  );
};

export default ImportRaces;