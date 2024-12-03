import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processHorseBatch, splitIntoBatches } from "./horseProcessing.ts";
import { ImportStats, HorseData } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 5;
const BATCH_DELAY = 2000; // 2 seconds between batches

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
    const stats: ImportStats = {
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
      // Fetch all runners for the date using off_time instead of date
      const { data: races, error: racesError } = await supabase
        .from('races')
        .select('id, runners(horse_id, horse)')
        .gte('off_time', `${date}T00:00:00Z`)
        .lt('off_time', `${date}T23:59:59Z`);

      if (racesError) throw racesError;

      // Collect all unique horses
      const horses = new Set<HorseData>();
      races?.forEach(race => {
        race.runners?.forEach((runner: any) => {
          if (runner.horse_id && runner.horse) {
            horses.add({ horseId: runner.horse_id, horseName: runner.horse });
          }
        });
      });

      const uniqueHorses = Array.from(horses);
      stats.totalHorses = uniqueHorses.length;
      console.log(`Found ${stats.totalHorses} unique horses to process`);

      // Update job with initial stats
      await supabase
        .from('import_jobs')
        .update({
          summary: stats
        })
        .eq('id', job.id);

      // Process horses in batches
      const batches = splitIntoBatches(uniqueHorses, BATCH_SIZE);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1} of ${batches.length}`);
        
        await processHorseBatch(supabase, batch, stats);
        
        // Update progress after each batch
        const progress = Math.round(((i + 1) / batches.length) * 100);
        await supabase
          .from('import_jobs')
          .update({
            progress,
            summary: stats
          })
          .eq('id', job.id);

        // Add delay between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

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
      
      // Update job with error status
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