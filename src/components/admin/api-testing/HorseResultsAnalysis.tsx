import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

export const HorseResultsAnalysis = () => {
  const [horseId, setHorseId] = useState("");
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Fetching horse results for:', id);
      
      const { data, error } = await supabase.functions.invoke('fetch-horse-results', {
        body: { horseId: id, type: 'results' },
      });

      if (error) throw error;
      console.log('Analysis response:', data);
      return data;
    },
    onError: (error: Error) => {
      console.error("Analysis fetch error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch horse results. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!horseId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a horse ID",
        variant: "destructive",
      });
      return;
    }
    analysisMutation.mutate(horseId);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Horse Results Analysis</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          placeholder="Enter horse ID..."
          value={horseId}
          onChange={(e) => setHorseId(e.target.value)}
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