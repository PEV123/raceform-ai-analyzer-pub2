import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { prepareRaceData } from "./utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 5;

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

    // Create a job record
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        date,
        status: 'processing',
        progress: 0
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
    console.log('API Response structure:', {
      hasRacecards: !!data.racecards,
      hasDataRacecards: !!data.data?.racecards,
      totalRaces: (data.racecards || data.data?.racecards || []).length
    });

    const races = data.racecards || data.data?.racecards || [];

    if (!races.length) {
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          progress: 100,
          summary: { message: 'No races found for this date' }
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ success: true, jobId: job.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${races.length} races`);
    let processedCount = 0;
    let nonRunnerUpdates = 0;
    let oddsUpdates = 0;

    // Process races in batches
    for (let i = 0; i < races.length; i += BATCH_SIZE) {
      const batch = races.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (race) => {
        try {
          console.log(`Processing race at ${race.course}`);
          
          // Check if race exists
          const { data: existingRace } = await supabase
            .from('races')
            .select('id')
            .eq('race_id', race.race_id)
            .single();

          let raceId;
          if (existingRace) {
            raceId = existingRace.id;
            console.log(`Race ${race.race_id} already exists with ID ${raceId}`);
          } else {
            // Prepare and insert new race
            const raceData = prepareRaceData(race);
            console.log('Inserting race with data:', raceData);

            const { data: newRace, error: raceError } = await supabase
              .from('races')
              .insert(raceData)
              .select()
              .single();

            if (raceError) {
              console.error(`Error inserting race ${race.race_id}:`, raceError);
              throw raceError;
            }
            
            raceId = newRace.id;
            console.log(`Inserted new race with ID ${raceId}`);
          }

          // Process runners
          if (race.runners?.length > 0) {
            console.log(`Processing ${race.runners.length} runners for race ${raceId}`);
            
            for (const runner of race.runners) {
              try {
                const { data: existingRunner } = await supabase
                  .from('runners')
                  .select('id, odds, is_non_runner')
                  .eq('race_id', raceId)
                  .eq('horse_id', runner.horse_id)
                  .single();

                if (existingRunner) {
                  if (existingRunner.is_non_runner !== runner.is_non_runner) {
                    nonRunnerUpdates++;
                  }
                  if (JSON.stringify(existingRunner.odds) !== JSON.stringify(runner.odds)) {
                    oddsUpdates++;
                  }

                  await supabase
                    .from('runners')
                    .update({
                      odds: runner.odds || [],
                      is_non_runner: runner.is_non_runner || false
                    })
                    .eq('id', existingRunner.id);
                } else {
                  await supabase
                    .from('runners')
                    .insert({
                      race_id: raceId,
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
                }
              } catch (runnerError) {
                console.error(`Error processing runner ${runner.horse_id}:`, runnerError);
              }
            }
          }

          processedCount++;
          const progress = Math.round((processedCount / races.length) * 100);
          
          await supabase
            .from('import_jobs')
            .update({ 
              progress,
              status: progress === 100 ? 'completed' : 'processing',
              summary: {
                processed: processedCount,
                total: races.length,
                nonRunnerUpdates,
                oddsUpdates
              }
            })
            .eq('id', job.id);

        } catch (error) {
          console.error(`Error processing race:`, error);
          throw error;
        }
      }));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        summary: {
          processed: processedCount,
          total: races.length,
          nonRunnerUpdates,
          oddsUpdates
        }
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