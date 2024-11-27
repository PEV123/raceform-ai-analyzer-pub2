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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch today's races
    const response = await fetch('https://api.theracingapi.com/v1/races', {
      headers: {
        'Authorization': 'Basic ' + btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)
      }
    })

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`)
    }

    const data = await response.json()
    console.log('Fetched races:', data)

    // Process and insert races
    for (const race of data.races) {
      const { error: raceError } = await supabase
        .from('races')
        .insert({
          id: race.id,
          off_time: race.off_time,
          course: race.course,
          race_name: race.race_name,
          region: race.region,
          race_class: race.race_class,
          age_band: race.age_band,
          rating_band: race.rating_band,
          prize: race.prize,
          field_size: race.field_size,
          created_at: new Date().toISOString(),
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
          is_abandoned: race.is_abandoned
        })

      if (raceError) {
        console.error('Error inserting race:', raceError)
        continue
      }

      // For each runner in the race, fetch their historical results
      for (const runner of race.runners) {
        console.log('Fetching historical results for horse:', runner.horse_id)
        
        const resultsResponse = await fetch(`https://api.theracingapi.com/v1/horses/${runner.horse_id}/results`, {
          headers: {
            'Authorization': 'Basic ' + btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)
          }
        })

        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json()
          console.log('Fetched results for horse:', runner.horse_id, resultsData)

          // Insert historical results
          for (const result of resultsData.results) {
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
                  position: result.runners.find(r => r.horse_id === runner.horse_id)?.position,
                  weight_lbs: result.runners.find(r => r.horse_id === runner.horse_id)?.weight_lbs,
                  winner: result.runners.find(r => r.position === '1')?.horse,
                  second: result.runners.find(r => r.position === '2')?.horse,
                  third: result.runners.find(r => r.position === '3')?.horse,
                  winner_weight_lbs: result.runners.find(r => r.position === '1')?.weight_lbs,
                  second_weight_lbs: result.runners.find(r => r.position === '2')?.weight_lbs,
                  third_weight_lbs: result.runners.find(r => r.position === '3')?.weight_lbs,
                  winner_btn: result.runners.find(r => r.position === '1')?.btn,
                  second_btn: result.runners.find(r => r.position === '2')?.btn,
                  third_btn: result.runners.find(r => r.position === '3')?.btn,
                  comment: result.runners.find(r => r.horse_id === runner.horse_id)?.comment
                })

              if (resultError) {
                console.error('Error inserting result:', resultError)
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
