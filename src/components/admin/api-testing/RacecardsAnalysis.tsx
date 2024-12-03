import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";

export const RacecardsAnalysis = () => {
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (selectedDate: Date) => {
      console.log('Fetching racecards for date:', selectedDate);
      
      const formattedDate = selectedDate.toISOString().split('T')[0];
      console.log('Formatted date for API:', formattedDate);
      
      const { data, error } = await supabase.functions.invoke('fetch-races-by-date', {
        body: { date: formattedDate },
      });

      if (error) throw error;
      console.log('Racecards API response:', data);
      return data;
    },
    onError: (error: Error) => {
      console.error("Racecards fetch error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch racecards. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }
    analysisMutation.mutate(date);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Racecards Pro Analysis</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <DatePicker
          date={date}
          onSelect={(newDate) => newDate && setDate(newDate)}
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