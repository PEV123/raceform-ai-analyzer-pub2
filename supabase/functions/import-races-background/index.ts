import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processRaceBatch } from "./raceProcessing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const stats = {
      totalRaces: 0,
      successfulRaces: 0,
      failedRaces: 0,
      totalHorses: 0,
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

    if (jobError) throw jobError;

    try {
      // First, fetch races from the API
      console.log('Fetching races from API for date:', date);
      const response = await fetch(
        `${Deno.env.get('RACING_API_URL')}/racecards/pro?date=${date}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${Deno.env.get('RACING_API_USERNAME')}:${Deno.env.get('RACING_API_PASSWORD')}`)}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      const races = data.racecards || [];
      console.log(`Found ${races.length} races to process`);
      
      stats.totalRaces = races.length;

      // Process races in batches
      await processRaceBatch(races, supabase, stats, job.id);

      // Mark job as completed
      await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          progress: 100,
          summary: stats
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          jobId: job.id,
          summary: stats
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error:', error);
      
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          error: error.message,
          summary: stats
        })
        .eq('id', job.id);

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