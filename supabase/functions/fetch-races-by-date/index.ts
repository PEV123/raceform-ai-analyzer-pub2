import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts"

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { date, timezone } = await req.json()
    console.log('Fetching races for date:', date, 'in timezone:', timezone)

    if (!date) {
      throw new Error('Date parameter is required')
    }

    if (!RACING_API_USERNAME || !RACING_API_PASSWORD) {
      throw new Error('Racing API credentials are not configured')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const apiUrl = `https://api.theracingapi.com/v1/racecards/pro?date=${date}`
    console.log('Making request to Racing API URL:', apiUrl)

    const response = await fetch(
      apiUrl,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Racing API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched races:', data)

    // Process and insert races
    for (const race of data.races || []) {
      console.log(`Processing race at ${race.course} - ${race.off_time}`)

      // Check if race already exists
      const { data: existingRace } = await supabase
        .from("races")
        .select("id")
        .eq("race_id", race.race_id)
        .single()

      if (existingRace) {
        console.log(`Race ${race.race_id} already exists, skipping`)
        continue
      }

      // Insert race
      const { data: raceData, error: raceError } = await supabase
        .from("races")
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
        console.error('Error inserting race:', raceError)
        throw raceError
      }

      console.log(`Successfully inserted race: ${raceData.id}`)

      // Process runners
      if (race.runners && Array.isArray(race.runners)) {
        for (const runner of race.runners) {
          // Fetch historical results for each runner
          console.log(`Fetching historical results for horse: ${runner.horse_id}`)
          
          const resultsResponse = await fetch(
            `https://api.theracingapi.com/v1/horses/${runner.horse_id}/results`,
            {
              headers: {
                'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
                'Accept': 'application/json'
              }
            }
          )

          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json()
            console.log(`Fetched results for horse: ${runner.horse_id}`, resultsData)

            // Insert historical results
            for (const result of resultsData.results || []) {
              const { data: existingResult } = await supabase
                .from('horse_results')
                .select()
                .eq('horse_id', runner.horse_id)
                .eq('race_id', result.race_id)
                .single()

              if (!existingResult) {
                const { error: resultError } = await supabase
                  .from('horse_results')
                  .insert({
                    horse_id: runner.horse_id,
                    race_id: result.race_id,
                    date: result.off_dt,
                    course: result.course,
                    distance: result.dist,
                    class: result.class,
                    going: result.going,
                    position: result.runners?.find(r => r.horse_id === runner.horse_id)?.position,
                    weight_lbs: result.runners?.find(r => r.horse_id === runner.horse_id)?.weight_lbs,
                    winner: result.runners?.find(r => r.position === '1')?.horse,
                    second: result.runners?.find(r => r.position === '2')?.horse,
                    third: result.runners?.find(r => r.position === '3')?.horse,
                    winner_weight_lbs: result.runners?.find(r => r.position === '1')?.weight_lbs,
                    second_weight_lbs: result.runners?.find(r => r.position === '2')?.weight_lbs,
                    third_weight_lbs: result.runners?.find(r => r.position === '3')?.weight_lbs,
                    winner_btn: result.runners?.find(r => r.position === '1')?.btn,
                    second_btn: result.runners?.find(r => r.position === '2')?.btn,
                    third_btn: result.runners?.find(r => r.position === '3')?.btn,
                    comment: result.runners?.find(r => r.horse_id === runner.horse_id)?.comment
                  })

                if (resultError) {
                  console.error('Error inserting result:', resultError)
                }
              }
            }
          }

          // Insert runner
          const { error: runnerError } = await supabase
            .from("runners")
            .insert({
              race_id: raceData.id,
              horse_id: runner.horse_id,
              number: Number(runner.number) || 0,
              draw: Number(runner.draw) || 0,
              horse: runner.horse,
              silk_url: runner.silk_url,
              sire: runner.sire,
              sire_region: runner.sire_region,
              dam: runner.dam,
              dam_region: runner.dam_region,
              form: runner.form,
              lbs: Number(runner.lbs) || 0,
              headgear: runner.headgear,
              ofr: runner.ofr,
              ts: runner.ts,
              jockey: runner.jockey || 'Unknown',
              trainer: runner.trainer,
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
              trainer_rtf: runner.trainer_rtf,
              odds: runner.odds || [],
            })

          if (runnerError) {
            console.error('Error inserting runner:', runnerError)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        races: data.races || [],
        timezone: timezone 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        races: [] 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})