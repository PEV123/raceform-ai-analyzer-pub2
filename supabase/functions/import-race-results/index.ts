import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME');
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD');
const RACING_API_URL = 'https://api.theracingapi.com/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date } = await req.json();
    console.log('Importing results for date:', date);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all races for the specified date
    const { data: races, error: racesError } = await supabase
      .from('races')
      .select('id, race_id')
      .gte('off_time', `${date}T00:00:00Z`)
      .lt('off_time', `${date}T23:59:59Z`);

    if (racesError) {
      throw racesError;
    }

    console.log(`Found ${races?.length || 0} races for date ${date}`);

    const results = [];
    for (const race of races || []) {
      if (!race.race_id) {
        console.log(`Skipping race ${race.id} - no race_id found`);
        continue;
      }

      try {
        console.log(`Fetching results for race ${race.race_id}`);
        const response = await fetch(
          `${RACING_API_URL}/results/${race.race_id}`,
          {
            headers: {
              'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error(`Error fetching results for race ${race.race_id}:`, response.statusText);
          continue;
        }

        const raceResult = await response.json();
        
        // Insert race result
        const { data: insertedResult, error: insertError } = await supabase
          .from('race_results')
          .insert({
            race_id: race.id,
            api_race_id: race.race_id,
            date: raceResult.date,
            region: raceResult.region,
            course: raceResult.course,
            course_id: raceResult.course_id,
            off_time: raceResult.off,
            off_dt: raceResult.off_dt,
            race_name: raceResult.race_name,
            type: raceResult.type,
            class: raceResult.class,
            pattern: raceResult.pattern,
            rating_band: raceResult.rating_band,
            age_band: raceResult.age_band,
            sex_rest: raceResult.sex_rest,
            dist: raceResult.dist,
            dist_y: raceResult.dist_y,
            dist_m: raceResult.dist_m,
            dist_f: raceResult.dist_f,
            going: raceResult.going,
            jumps: raceResult.jumps,
            winning_time_detail: raceResult.winning_time_detail,
            comments: raceResult.comments,
            non_runners: raceResult.non_runners,
            tote_win: raceResult.tote_win,
            tote_pl: raceResult.tote_pl,
            tote_ex: raceResult.tote_ex,
            tote_csf: raceResult.tote_csf,
            tote_tricast: raceResult.tote_tricast,
            tote_trifecta: raceResult.tote_trifecta
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting race result:`, insertError);
          continue;
        }

        // Insert runner results
        for (const runner of raceResult.runners || []) {
          const { error: runnerError } = await supabase
            .from('runner_results')
            .insert({
              race_result_id: insertedResult.id,
              horse_id: runner.horse_id,
              horse: runner.horse,
              sp: runner.sp,
              sp_dec: runner.sp_dec,
              number: runner.number,
              position: runner.position,
              draw: runner.draw,
              btn: runner.btn,
              ovr_btn: runner.ovr_btn,
              age: runner.age,
              sex: runner.sex,
              weight: runner.weight,
              weight_lbs: runner.weight_lbs,
              headgear: runner.headgear,
              time: runner.time,
              or_rating: runner.or,
              rpr: runner.rpr,
              tsr: runner.tsr,
              prize: runner.prize,
              jockey: runner.jockey,
              jockey_claim_lbs: runner.jockey_claim_lbs,
              jockey_id: runner.jockey_id,
              trainer: runner.trainer,
              trainer_id: runner.trainer_id,
              owner: runner.owner,
              owner_id: runner.owner_id,
              sire: runner.sire,
              sire_id: runner.sire_id,
              dam: runner.dam,
              dam_id: runner.dam_id,
              damsire: runner.damsire,
              damsire_id: runner.damsire_id,
              comment: runner.comment,
              silk_url: runner.silk_url
            });

          if (runnerError) {
            console.error(`Error inserting runner result:`, runnerError);
          }
        }

        results.push(insertedResult);
      } catch (error) {
        console.error(`Error processing race ${race.race_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-race-results function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});