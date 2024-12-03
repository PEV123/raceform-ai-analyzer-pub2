import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImportJob, ImportStats } from "./types.ts";

export class JobManager {
  private supabase;
  private jobId: string;

  constructor(supabaseUrl: string, supabaseKey: string, jobId: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.jobId = jobId;
  }

  async updateProgress(progress: number, stats: ImportStats) {
    console.log(`Updating job progress: ${progress}%`);
    
    try {
      const { error } = await this.supabase
        .from('import_jobs')
        .update({ 
          progress,
          summary: stats
        })
        .eq('id', this.jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating job progress:', error);
    }
  }

  async complete(stats: ImportStats) {
    console.log('Marking job as completed');
    
    try {
      const { error } = await this.supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          progress: 100,
          summary: stats
        })
        .eq('id', this.jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing job:', error);
    }
  }

  async fail(error: Error, stats: ImportStats) {
    console.error('Marking job as failed:', error);
    
    try {
      const { error: updateError } = await this.supabase
        .from('import_jobs')
        .update({ 
          status: 'failed',
          error: error.message,
          summary: stats
        })
        .eq('id', this.jobId);

      if (updateError) throw updateError;
    } catch (updateError) {
      console.error('Error updating failed job:', updateError);
    }
  }
}