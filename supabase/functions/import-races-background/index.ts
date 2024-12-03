import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processRaceBatch } from "./raceProcessing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 3; // Reduced batch size to prevent resource exhaustion

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

    // Create a job record
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

    // Validate API configuration
    let apiUrl = Deno.env.get('RACING_API_URL');
    if (!apiUrl) throw new Error('RACING_API_URL not configured');
    
    apiUrl = apiUrl.replace(/\/$/, '');
    if (!apiUrl.endsWith('/v1')) apiUrl = `${apiUrl}/v1`;

    const apiUsername = Deno.env.get('RACING_API_USERNAME');
    const apiPassword = Deno.env.get('RACING_API_PASSWORD');
    if (!apiUsername || !apiPassword) {
      throw new Error('Racing API credentials not configured');
    }

    // Fetch races
    const response = await fetch(
      `${apiUrl}/racecards/pro?date=${date}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${apiUsername}:${apiPassword}`)}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const races = data.racecards || data.data?.racecards || [];
    stats.totalRaces = races.length;

    if (!races.length) {
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          progress: 100,
          summary: stats
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ success: true, jobId: job.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${races.length} races`);

    // Process races in smaller batches with delays between batches
    for (let i = 0; i < races.length; i += BATCH_SIZE) {
      const batch = races.slice(i, i + BATCH_SIZE);
      await processRaceBatch(batch, supabase, stats, job.id);
      
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

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