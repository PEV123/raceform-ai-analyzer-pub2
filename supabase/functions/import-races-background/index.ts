import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processRaceBatch } from "./raceProcessing.ts";
import { fetchRacesFromApi } from "./apiClient.ts";
import { JobManager } from "./jobManager.ts";
import { ImportStats } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 2;
const API_TIMEOUT = 30000; // 30 seconds
const BATCH_DELAY = 2000; // 2 seconds between batches

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date } = await req.json();
    console.log('Starting background import for date:', date);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize stats
    const stats: ImportStats = {
      totalRaces: 0,
      successfulRaces: 0,
      failedRaces: 0,
      horseResults: {
        attempted: 0,
        successful: 0,
        failed: 0
      },
      distanceAnalysis: {
        attempted: 0,
        successful: 0,
        failed: 0
      }
    };

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        date,
        status: 'processing',
        progress: 0,
        summary: stats
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating import job:', jobError);
      throw jobError;
    }

    const jobManager = new JobManager(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      job.id
    );

    // Set up timeout handler for API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const races = await fetchRacesFromApi(date, controller.signal);
      clearTimeout(timeout);
      
      stats.totalRaces = races.length;
      console.log(`Found ${races.length} races to process`);

      if (!races.length) {
        await jobManager.complete(stats);
        return new Response(
          JSON.stringify({ success: true, jobId: job.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Process races in batches
      for (let i = 0; i < races.length; i += BATCH_SIZE) {
        const batch = races.slice(i, i + BATCH_SIZE);
        await processRaceBatch(batch, supabase, stats, job.id);
        
        // Update progress
        const progress = Math.round(((i + batch.length) / races.length) * 100);
        await jobManager.updateProgress(progress, stats);
        
        // Add delay between batches
        if (i + BATCH_SIZE < races.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      await jobManager.complete(stats);

      return new Response(
        JSON.stringify({ 
          success: true, 
          jobId: job.id,
          summary: stats
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      clearTimeout(timeout);
      await jobManager.fail(error, stats);
      throw error;
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});