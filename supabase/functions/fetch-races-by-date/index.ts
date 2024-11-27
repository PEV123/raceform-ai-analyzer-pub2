import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { getSupabaseClient, insertRace, insertRunner, insertHorseResult } from "./db.ts"
import { fetchRacesFromApi, fetchHorseResults } from "./api.ts"

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

    const supabase = getSupabaseClient()
    const data = await fetchRacesFromApi(date)
    
    // Process and insert races
    for (const race of data.races || []) {
      console.log(`Processing race at ${race.course} - ${race.off_time}`)

      try {
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
        const raceData = await insertRace(supabase, race)
        console.log(`Successfully inserted race: ${raceData.id}`)

        // Process runners
        if (race.runners && Array.isArray(race.runners)) {
          for (const runner of race.runners) {
            try {
              // Insert runner
              await insertRunner(supabase, raceData.id, runner)

              // Fetch and insert historical results
              const resultsData = await fetchHorseResults(runner.horse_id)
              if (resultsData?.results) {
                for (const result of resultsData.results) {
                  try {
                    // Check if result already exists
                    const { data: existingResult } = await supabase
                      .from('horse_results')
                      .select()
                      .eq('horse_id', runner.horse_id)
                      .eq('race_id', result.race_id)
                      .single()

                    if (!existingResult) {
                      await insertHorseResult(supabase, runner.horse_id, result)
                    }
                  } catch (error) {
                    console.error(`Error processing result for horse ${runner.horse_id}:`, error)
                  }
                }
              }
            } catch (error) {
              console.error(`Error processing runner ${runner.horse_id}:`, error)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing race ${race.race_id}:`, error)
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