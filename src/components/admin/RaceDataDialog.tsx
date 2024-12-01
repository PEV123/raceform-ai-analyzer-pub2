import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

interface RaceDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  race: Tables<"races"> & {
    runners: Tables<"runners">[];
  };
}

export const RaceDataDialog = ({ open, onOpenChange, race }: RaceDataDialogProps) => {
  console.log('RaceDataDialog rendered with race:', race);

  // Query for horse results
  const { data: horseResults } = useQuery({
    queryKey: ["horse-results", race?.id],
    queryFn: async () => {
      console.log('Fetching horse results for race:', race?.id);
      const horseIds = race?.runners?.map(runner => runner.horse_id) || [];
      
      if (horseIds.length === 0) {
        console.log('No horse IDs found for results query');
        return [];
      }

      const { data, error } = await supabase
        .from('horse_results')
        .select('*')
        .in('horse_id', horseIds);

      if (error) {
        console.error('Error fetching horse results:', error);
        throw error;
      }
      console.log('Found horse results:', data);
      return data;
    },
    enabled: !!race?.id && !!race?.runners?.length,
  });

  // Query for distance analysis
  const { data: distanceAnalysis } = useQuery({
    queryKey: ["distance-analysis", race?.id],
    queryFn: async () => {
      console.log('Fetching distance analysis for race:', race?.id);
      const horseIds = race?.runners?.map(runner => runner.horse_id) || [];
      
      if (horseIds.length === 0) {
        console.log('No horse IDs found for distance analysis query');
        return [];
      }

      const { data, error } = await supabase
        .from('horse_distance_analysis')
        .select(`
          *,
          horse_distance_details (
            *,
            horse_distance_times (*)
          )
        `)
        .in('horse_id', horseIds);

      if (error) {
        console.error('Error fetching distance analysis:', error);
        throw error;
      }
      console.log('Found distance analysis:', data);
      return data;
    },
    enabled: !!race?.id && !!race?.runners?.length,
  });

  if (!race) {
    console.log('No race data provided to RaceDataDialog');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Race Database Data</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full">
          <Tabs defaultValue="race">
            <TabsList>
              <TabsTrigger value="race">Race Data</TabsTrigger>
              <TabsTrigger value="results">Horse Results</TabsTrigger>
              <TabsTrigger value="analysis">Distance Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="race" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Race Details</h3>
                <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {JSON.stringify(race, null, 2)}
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="results" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Horse Results</h3>
                <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {JSON.stringify(horseResults, null, 2)}
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="analysis" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Distance Analysis</h3>
                <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {JSON.stringify(distanceAnalysis, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};