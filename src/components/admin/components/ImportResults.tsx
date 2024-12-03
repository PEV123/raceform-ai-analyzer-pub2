import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DateSelector } from "./DateSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const ImportResults = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    try {
      setIsImporting(true);
      
      const { data, error } = await supabase.functions.invoke('import-race-results', {
        body: { 
          date: date.toISOString().split('T')[0]
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Imported results for ${data.processed} races`,
      });
    } catch (error) {
      console.error('Error importing results:', error);
      toast({
        title: "Error",
        description: "Failed to import race results",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Import Results</h2>
        
        <div className="flex items-center gap-4">
          <DateSelector
            date={date}
            onSelect={(newDate) => {
              if (newDate) {
                setDate(newDate);
              }
            }}
            disabled={isImporting}
            label="Select Date"
          />

          <Button
            onClick={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing Results...
              </>
            ) : (
              "Import Results"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};