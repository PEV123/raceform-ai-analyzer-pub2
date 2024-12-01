import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { useClearRacesMutation } from "./mutations/useClearRacesMutation";
import { useImportRacesMutation } from "./mutations/useImportRacesMutation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useState } from "react";

const ImportRaces = () => {
  const clearMutation = useClearRacesMutation();
  const importMutation = useImportRacesMutation();
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>("");
  const [clearDate, setClearDate] = useState<Date | undefined>();
  
  // Initialize with current UK date
  const [date, setDate] = useState<Date>(() => {
    const ukDate = fromZonedTime(new Date(), 'Europe/London');
    console.log('Initial UK date set to:', format(ukDate, 'yyyy-MM-dd'));
    return ukDate;
  });

  const { data: settings } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Format the date in UK timezone
  const formattedDate = formatInTimeZone(date, 'Europe/London', "MMMM do, yyyy");
  const formattedClearDate = clearDate 
    ? formatInTimeZone(clearDate, 'Europe/London', "MMMM do, yyyy")
    : "Select date";

  const handleImport = async () => {
    await importMutation.mutateAsync({
      date,
      onProgress: (progress: number, operation: string) => {
        setProgress(progress);
        setCurrentOperation(operation);
      }
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Import Races</h2>
      <p className="text-muted-foreground mb-4">
        Import races from the Racing API for a specific date
      </p>
      <div className="flex gap-4 mb-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={clearMutation.isPending || importMutation.isPending}
            >
              {clearMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Races by Date
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Select date to clear</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !clearDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formattedClearDate}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={clearDate}
                        onSelect={setClearDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {clearDate && (
                  <p className="text-red-500">
                    Are you absolutely sure you want to clear all races from {formattedClearDate}? 
                    This action cannot be undone.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClearDate(undefined)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (clearDate) {
                    clearMutation.mutate(clearDate);
                    setClearDate(undefined);
                  }
                }}
                disabled={!clearDate}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                disabled={importMutation.isPending}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formattedDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    // Convert the selected date to UK timezone
                    const ukDate = fromZonedTime(newDate, 'Europe/London');
                    console.log('New UK date selected:', format(ukDate, 'yyyy-MM-dd'));
                    setDate(ukDate);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleImport}
            disabled={clearMutation.isPending || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Races"
            )}
          </Button>
        </div>
      </div>

      {importMutation.isPending && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{currentOperation}</p>
        </div>
      )}
    </Card>
  );
};

export default ImportRaces;