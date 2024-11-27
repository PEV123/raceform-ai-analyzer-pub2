import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HorseIdSearchProps {
  onResults: (results: any[]) => void;
  onRawData: (data: any) => void;
}

export const HorseIdSearch = ({ onResults, onRawData }: HorseIdSearchProps) => {
  const [horseId, setHorseId] = useState("");
  const { toast } = useToast();

  const resultsMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Fetching results for horse ID:', id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No session found");
      }

      const { data, error } = await supabase.functions.invoke('fetch-horse-results', {
        body: { horseId: id },
      });

      if (error) throw error;
      console.log('API Response:', data);
      onRawData(data);
      return data.results || [];
    },
    onSuccess: (data) => {
      onResults(data);
      if (data.length === 0) {
        toast({
          title: "No results found",
          description: "No race results found for this horse",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Results fetch error:", error);
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
    resultsMutation.mutate(horseId);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Search by Horse ID</h2>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Enter horse ID..."
          value={horseId}
          onChange={(e) => setHorseId(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit"
          disabled={resultsMutation.isPending}
        >
          {resultsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};