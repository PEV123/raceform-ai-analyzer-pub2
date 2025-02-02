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

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const POLL_INTERVAL = 3000; // 3 seconds

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useImportRacesMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, onProgress, onUpdateSummary }: ImportRacesParams) => {
      console.log('Starting race import for date:', date);
      
      // Format the date in UK timezone for the API request
      const ukDate = formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
      console.log('Formatted UK date for API request:', ukDate);

      let lastError: Error | null = null;
      let pollIntervalId: number | null = null;
      
      // Implement retry logic
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`Attempt ${attempt} of ${MAX_RETRIES}`);
          
          // Start background job
          const { data: response, error: jobError } = await supabase.functions.invoke(
            'import-races-background',
            {
              body: { date: ukDate }
            }
          );

          if (jobError) {
            console.error(`Error starting import job (attempt ${attempt}):`, jobError);
            lastError = jobError;
            
            if (attempt < MAX_RETRIES) {
              console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
              await wait(RETRY_DELAY);
              continue;
            }
            throw jobError;
          }

          console.log('Import job started:', response.jobId);

          // Start polling for job progress
          return new Promise((resolve, reject) => {
            pollIntervalId = window.setInterval(async () => {
              try {
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
                  console.log('Job progress update:', {
                    status: typedJob.status,
                    progress: typedJob.progress,
                    summary: typedJob.summary
                  });

                  // Update progress
                  if (typedJob.summary?.totalHorses > 0) {
                    const processedHorses = (typedJob.summary.horseResults?.successful || 0) + 
                                         (typedJob.summary.horseResults?.failed || 0);
                    const horseProgress = (processedHorses / typedJob.summary.totalHorses) * 100;
                    onProgress?.(horseProgress, `Processing horses (${processedHorses}/${typedJob.summary.totalHorses})`);
                  } else {
                    onProgress?.(typedJob.progress, `Processing races (${typedJob.progress}%)`);
                  }

                  if (typedJob.status === 'completed') {
                    if (pollIntervalId) clearInterval(pollIntervalId);
                    onProgress?.(100, 'Import complete');
                    
                    // Fetch and display summary if available
                    if (typedJob.summary && onUpdateSummary) {
                      onUpdateSummary(typedJob.summary);
                    }
                    
                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ queryKey: ['races'] });
                    resolve(response.jobId);
                  } else if (typedJob.status === 'failed') {
                    if (pollIntervalId) clearInterval(pollIntervalId);
                    reject(new Error(typedJob.error || 'Import failed'));
                  }
                }
              } catch (pollError) {
                console.error("Error in polling interval:", pollError);
                if (pollIntervalId) clearInterval(pollIntervalId);
                reject(pollError);
              }
            }, POLL_INTERVAL);
          });

        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          lastError = error as Error;
          
          if (attempt < MAX_RETRIES) {
            console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
            await wait(RETRY_DELAY);
            continue;
          }
          throw error;
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Import failed after all retries');
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