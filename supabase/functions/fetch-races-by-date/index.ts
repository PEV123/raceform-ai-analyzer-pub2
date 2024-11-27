import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { getSupabaseClient, insertRace, insertRunner, insertHorseResult } from "./db.ts"
import { fetchRacesFromApi, fetchHorseResults } from "./api.ts"
import { Race } from "./types.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { date, timezone } = await req.json()
    console.log('Fetching races for date:', date, 'in timezone:', timezone)

    if (!date) {
      throw new Error('Date parameter is required')
    }

    const supabase = getSupabaseClient()
    
    try {
      const data = await fetchRacesFromApi(date)
      console.log(`Processing ${data.races.length} races from API`)
      
      const processedRaces: (Race & { status: string; error?: string })[] = []
      
      for (const race of data.races) {
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
            processedRaces.push({ ...race, status: 'skipped' })
            continue
          }

          // Insert race
          const raceData = await insertRace(supabase, race)
          console.log(`Successfully inserted race: ${raceData.id}`)

          // Process runners
          if (race.runners && Array.isArray(race.runners)) {
            for (const runner of race.runners) {
              if (!runner.horse_id || !runner.horse) {
                console.warn(`Invalid runner data for race ${race.race_id}:`, runner)
                continue
              }

              await insertRunner(supabase, raceData.id, runner)

              // Fetch and insert historical results
              const resultsData = await fetchHorseResults(runner.horse_id)
              if (resultsData?.results) {
                for (const result of resultsData.results) {
                  try {
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
            }
          }

          processedRaces.push({ ...race, status: 'inserted' })
        } catch (error) {
          console.error(`Error processing race ${race.race_id}:`, error)
          processedRaces.push({ 
            ...race, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      console.log('Processed races summary:', processedRaces.map(r => ({
        course: r.course,
        off_time: r.off_time,
        status: r.status,
        error: r.error
      })))

      return new Response(
        JSON.stringify({ 
          success: true,
          races: processedRaces,
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
      console.error('API or processing error:', error)
      throw error
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        races: [] 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    )
  }
})