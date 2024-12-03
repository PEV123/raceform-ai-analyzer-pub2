import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

interface ImportRacesParams {
  date: Date;
  onProgress?: (progress: number, operation: string) => void;
  onUpdateSummary?: (summary: any) => void;
}

interface ImportJob {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error: string | null;
  summary: any;
  created_at: string;
  updated_at: string;
}

export const useImportRacesMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, onProgress, onUpdateSummary }: ImportRacesParams) => {
      console.log('Starting race import for date:', date);
      
      // Format the date in UK timezone for the API request
      const ukDate = formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
      console.log('Formatted UK date for API request:', ukDate);

      // Start background job
      const { data: response, error: jobError } = await supabase.functions.invoke(
        'import-races-background',
        {
          body: { date: ukDate }
        }
      );

      if (jobError) {
        console.error("Error starting import job:", jobError);
        throw jobError;
      }

      console.log('Import job started:', response.jobId);

      // Start polling for job progress
      const pollInterval = setInterval(async () => {
        const { data: job, error: pollError } = await supabase
          .from('import_jobs')
          .select('*')
          .eq('id', response.jobId)
          .single();

        if (pollError) {
          console.error("Error polling job status:", pollError);
          return;
        }

        if (job) {
          const typedJob = job as ImportJob;
          onProgress?.(typedJob.progress, `Processing races (${typedJob.progress}%)`);

          if (typedJob.status === 'completed') {
            clearInterval(pollInterval);
            onProgress?.(100, 'Import complete');
            
            // Fetch and display summary if available
            if (typedJob.summary && onUpdateSummary) {
              onUpdateSummary(typedJob.summary);
            }
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['races'] });
          } else if (typedJob.status === 'failed') {
            clearInterval(pollInterval);
            throw new Error(typedJob.error || 'Import failed');
          }
        }
      }, 2000); // Poll every 2 seconds

      // Return the job ID
      return response.jobId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Races imported successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Error importing races:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to import races. Please try again.",
        variant: "destructive",
      });
    },
  });
};