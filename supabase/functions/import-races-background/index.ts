import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processHorseBatch, splitIntoBatches } from "./horseProcessing.ts";
import { fetchRacesFromApi } from "./apiClient.ts";
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
      // First, fetch races from the API
      console.log('Fetching races from API for date:', date);
      const races = await fetchRacesFromApi(date, new AbortController().signal);
      console.log(`Found ${races.length} races to process`);
      
      stats.totalRaces = races.length;

      // Process each race
      for (const race of races) {
        try {
          console.log(`Processing race at ${race.course} - ${race.off_time} - Race ID: ${race.race_id}`);
          
          // Check if race already exists
          const { data: existingRace } = await supabase
            .from("races")
            .select("id, race_id")
            .eq("race_id", race.race_id)
            .single();

          if (existingRace) {
            console.log(`Race ${race.race_id} already exists, skipping`);
            continue;
          }

          // Insert race
          const { data: insertedRace, error: insertError } = await supabase
            .from("races")
            .insert({
              ...race,
              off_time: race.off_dt || race.off_time
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting race:', insertError);
            stats.failedRaces++;
            continue;
          }

          stats.successfulRaces++;
          console.log(`Successfully inserted race: ${insertedRace.id}`);

          // Process runners if available
          if (race.runners?.length > 0) {
            console.log(`Processing ${race.runners.length} runners for race ${insertedRace.id}`);
            
            for (const runner of race.runners) {
              if (!runner.horse_id || !runner.horse) {
                console.warn(`Invalid runner data for race ${race.race_id}:`, runner);
                continue;
              }

              const { error: runnerError } = await supabase
                .from("runners")
                .insert({
                  race_id: insertedRace.id,
                  horse_id: runner.horse_id,
                  number: parseInt(runner.number) || 0,
                  draw: parseInt(runner.draw) || 0,
                  horse: runner.horse,
                  silk_url: runner.silk_url,
                  sire: runner.sire,
                  sire_region: runner.sire_region,
                  dam: runner.dam,
                  dam_region: runner.dam_region,
                  form: runner.form,
                  lbs: parseInt(runner.lbs) || 0,
                  headgear: runner.headgear,
                  ofr: runner.ofr,
                  ts: runner.ts,
                  jockey: runner.jockey,
                  trainer: runner.trainer,
                  odds: runner.odds || [],
                  is_non_runner: runner.is_non_runner || false
                });

              if (runnerError) {
                console.error(`Error inserting runner ${runner.horse_id}:`, runnerError);
                continue;
              }

              console.log(`Successfully inserted runner ${runner.horse_id}`);
            }
          }
        } catch (error) {
          console.error(`Error processing race:`, error);
          stats.failedRaces++;
        }
      }

      // After processing races, collect all unique horses
      console.log('Fetching all runners to process horse data...');
      const { data: runners, error: runnersError } = await supabase
        .from('runners')
        .select('horse_id, horse')
        .gte('created_at', `${date}T00:00:00Z`)
        .lt('created_at', `${date}T23:59:59Z`);

      if (runnersError) throw runnersError;

      // Get unique horses
      const uniqueHorses = Array.from(new Set(runners?.map(r => JSON.stringify({ horseId: r.horse_id, horseName: r.horse }))))
        .map(str => JSON.parse(str) as HorseData);

      stats.totalHorses = uniqueHorses.length;
      console.log(`Found ${stats.totalHorses} unique horses to process`);

      // Process horses in batches
      const batches = splitIntoBatches(uniqueHorses, BATCH_SIZE);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing horse batch ${i + 1} of ${batches.length}`);
        
        await processHorseBatch(supabase, batch, stats);
        
        // Update progress
        const progress = Math.round(((i + 1) / batches.length) * 100);
        await supabase
          .from('import_jobs')
          .update({
            progress,
            summary: stats
          })
          .eq('id', job.id);

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