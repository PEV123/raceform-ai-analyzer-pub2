import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { date } = await req.json()
    console.log('Starting background import for date:', date)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a job record to track progress
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        date,
        status: 'processing',
        progress: 0
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating import job:', jobError)
      throw jobError
    }

    console.log('Created import job:', job.id)

    // Validate and format API URL
    let apiUrl = Deno.env.get('RACING_API_URL')
    if (!apiUrl) {
      throw new Error('RACING_API_URL environment variable is not set')
    }
    apiUrl = apiUrl.replace(/\/$/, '')
    if (!apiUrl.endsWith('/v1')) {
      apiUrl = `${apiUrl}/v1`
    }

    const apiUsername = Deno.env.get('RACING_API_USERNAME')
    const apiPassword = Deno.env.get('RACING_API_PASSWORD')
    if (!apiUsername || !apiPassword) {
      throw new Error('Racing API credentials are not properly configured')
    }

    // Fetch races from API
    const raceUrl = `${apiUrl}/racecards/pro?date=${date}`
    console.log('Fetching races from:', raceUrl)
    
    const response = await fetch(
      raceUrl,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${apiUsername}:${apiPassword}`)}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    console.log('Raw API Response:', JSON.stringify(data, null, 2))
    
    // Extract races from response
    let races = []
    if (data.racecards && Array.isArray(data.racecards)) {
      races = data.racecards
    } else if (data.data?.racecards && Array.isArray(data.data.racecards)) {
      races = data.data.racecards
    }

    if (!races.length) {
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          progress: 100,
          summary: { message: 'No races found for this date' }
        })
        .eq('id', job.id)

      return new Response(
        JSON.stringify({ success: true, jobId: job.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${races.length} races`)
    let processedCount = 0
    let nonRunnerUpdates = 0
    let oddsUpdates = 0

    // Process races in batches
    for (let i = 0; i < races.length; i += BATCH_SIZE) {
      const batch = races.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(async (race) => {
        try {
          console.log(`Processing race at ${race.course}`)
          
          // Check if race exists
          const { data: existingRace } = await supabase
            .from('races')
            .select('id')
            .eq('race_id', race.race_id)
            .single()

          let raceId
          if (existingRace) {
            raceId = existingRace.id
            console.log(`Race ${race.race_id} already exists with ID ${raceId}`)
          } else {
            // Insert new race
            const { data: newRace, error: raceError } = await supabase
              .from('races')
              .insert({
                off_time: race.off_time,
                course: race.course,
                race_name: race.race_name,
                region: race.region,
                race_class: race.race_class,
                age_band: race.age_band,
                rating_band: race.rating_band,
                prize: race.prize,
                field_size: Number(race.field_size) || 0,
                race_id: race.race_id,
                course_id: race.course_id,
                distance_round: race.distance_round,
                distance: race.distance,
                distance_f: race.distance_f,
                pattern: race.pattern,
                type: race.type,
                going_detailed: race.going_detailed,
                rail_movements: race.rail_movements,
                stalls: race.stalls,
                weather: race.weather,
                going: race.going,
                surface: race.surface,
                jumps: race.jumps,
                big_race: race.big_race,
                is_abandoned: race.is_abandoned,
              })
              .select()
              .single()

            if (raceError) {
              console.error(`Error inserting race ${race.race_id}:`, raceError)
              throw raceError
            }
            raceId = newRace.id
            console.log(`Inserted new race with ID ${raceId}`)
          }

          // Process runners
          if (race.runners && Array.isArray(race.runners)) {
            for (const runner of race.runners) {
              try {
                // Check if runner exists
                const { data: existingRunner } = await supabase
                  .from('runners')
                  .select('id, odds, is_non_runner')
                  .eq('race_id', raceId)
                  .eq('horse_id', runner.horse_id)
                  .single()

                if (existingRunner) {
                  // Update existing runner
                  if (existingRunner.is_non_runner !== runner.is_non_runner) {
                    nonRunnerUpdates++
                  }
                  if (JSON.stringify(existingRunner.odds) !== JSON.stringify(runner.odds)) {
                    oddsUpdates++
                  }

                  await supabase
                    .from('runners')
                    .update({
                      odds: runner.odds || [],
                      is_non_runner: runner.is_non_runner || false
                    })
                    .eq('id', existingRunner.id)

                } else {
                  // Insert new runner
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
                      is_non_runner: runner.is_non_runner || false,
                      dob: runner.dob,
                      age: runner.age,
                      sex: runner.sex,
                      sex_code: runner.sex_code,
                      colour: runner.colour,
                      region: runner.region,
                      breeder: runner.breeder,
                      dam_id: runner.dam_id,
                      damsire: runner.damsire,
                      damsire_id: runner.damsire_id,
                      damsire_region: runner.damsire_region,
                      trainer_id: runner.trainer_id,
                      trainer_location: runner.trainer_location,
                      trainer_14_days: runner.trainer_14_days,
                      owner: runner.owner,
                      owner_id: runner.owner_id,
                      prev_trainers: runner.prev_trainers || [],
                      prev_owners: runner.prev_owners || [],
                      comment: runner.comment,
                      spotlight: runner.spotlight,
                      quotes: runner.quotes || [],
                      stable_tour: runner.stable_tour || [],
                      medical: runner.medical || [],
                      headgear_run: runner.headgear_run,
                      wind_surgery: runner.wind_surgery,
                      wind_surgery_run: runner.wind_surgery_run,
                      past_results_flags: runner.past_results_flags || [],
                      rpr: runner.rpr,
                      jockey_id: runner.jockey_id,
                      last_run: runner.last_run,
                      trainer_rtf: runner.trainer_rtf
                    })
                }
              } catch (runnerError) {
                console.error(`Error processing runner ${runner.horse_id}:`, runnerError)
              }
            }
          }

          processedCount++
          const progress = Math.round((processedCount / races.length) * 100)
          
          // Update job progress
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
            .eq('id', job.id)

        } catch (error) {
          console.error(`Error processing race:`, error)
          throw error
        }
      }))
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
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})