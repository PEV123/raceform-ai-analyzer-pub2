import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

export const RaceResultsAnalysis = () => {
  const [raceId, setRaceId] = useState("");
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Fetching race results for:', id);
      
      const { data, error } = await supabase.functions.invoke('fetch-race-results', {
        body: { raceId: id },
      });

      if (error) throw error;
      console.log('Results response:', data);
      return data;
    },
    onError: (error: Error) => {
      console.error("Results fetch error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch race results. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raceId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a race ID",
        variant: "destructive",
      });
      return;
    }
    analysisMutation.mutate(raceId);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Race Results Analysis</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          placeholder="Enter race ID..."
          value={raceId}
          onChange={(e) => setRaceId(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit"
          disabled={analysisMutation.isPending}
        >
          {analysisMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Analyze
            </>
          )}
        </Button>
      </form>

      {analysisMutation.data && (
        <div>
          <h3 className="font-semibold mb-2">Raw API Response:</h3>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(analysisMutation.data, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};