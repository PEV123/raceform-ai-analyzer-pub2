import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { getSupabaseClient } from "./db.ts"
import { fetchRacesFromApi } from "./api.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { date } = await req.json()
    console.log('Received request with date:', date)

    if (!date) {
      throw new Error('Date parameter is required')
    }

    const supabase = getSupabaseClient()
    
    try {
      const { races } = await fetchRacesFromApi(date)
      console.log(`Processing ${races?.length || 0} races from API`)
      
      if (!Array.isArray(races) || races.length === 0) {
        console.log('No races found for date:', date)
        return new Response(
          JSON.stringify({ 
            success: true,
            races: [],
            message: 'No races found for the specified date'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
            } 
          }
        )
      }

      const processedRaces = []
      
      for (const race of races) {
        console.log(`Processing race at ${race.course} - ${race.off_time} - Race ID: ${race.race_id}`)
        
        try {
          // IMPORTANT: Changed to check by race_id AND off_time to handle multiple races at same course
          const { data: existingRace, error: checkError } = await supabase
            .from("races")
            .select("id, race_id, off_time")
            .eq("race_id", race.race_id)
            .single()

          if (checkError) {
            console.error('Error checking existing race:', checkError)
          }

          console.log('Existing race check:', {
            raceId: race.race_id,
            exists: !!existingRace,
            existingData: existingRace
          })

          if (existingRace) {
            console.log(`Race ${race.race_id} already exists, skipping`)
            processedRaces.push({ 
              ...race, 
              status: 'skipped',
              existing_id: existingRace.id 
            })
            continue
          }

          // Ensure proper datetime format for off_time
          const raceData = {
            ...race,
            off_time: race.off_dt || race.off_time // Use off_dt if available, fallback to off_time
          }

          console.log('Inserting race data:', raceData)

          // Insert race
          const { data: insertedRace, error: insertError } = await supabase
            .from("races")
            .insert(raceData)
            .select()
            .single()

          if (insertError) {
            console.error('Error inserting race:', insertError)
            throw insertError
          }

          console.log(`Successfully inserted race: ${insertedRace.id}`)

          // Process runners if available
          if (race.runners && Array.isArray(race.runners)) {
            console.log(`Processing ${race.runners.length} runners for race ${insertedRace.id}`)
            
            for (const runner of race.runners) {
              if (!runner.horse_id || !runner.horse) {
                console.warn(`Invalid runner data for race ${race.race_id}:`, runner)
                continue
              }

              const runnerData = {
                race_id: insertedRace.id,
                horse_id: runner.horse_id,
                number: parseInt(runner.number) || null,
                draw: parseInt(runner.draw) || null,
                horse: runner.horse,
                silk_url: runner.silk_url,
                sire: runner.sire,
                sire_region: runner.sire_region,
                dam: runner.dam,
                dam_region: runner.dam_region,
                form: runner.form,
                lbs: parseInt(runner.lbs) || null,
                headgear: runner.headgear,
                ofr: runner.ofr,
                ts: runner.ts,
                jockey: runner.jockey,
                trainer: runner.trainer,
                odds: runner.odds || [],
                is_non_runner: runner.is_non_runner || false
              }

              console.log(`Inserting runner ${runner.horse_id} for race ${insertedRace.id}`)

              const { error: runnerError } = await supabase
                .from("runners")
                .insert(runnerData)

              if (runnerError) {
                console.error(`Error inserting runner ${runner.horse_id}:`, runnerError)
                continue
              }

              console.log(`Successfully inserted runner ${runner.horse_id}`)
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
        race_id: r.race_id,
        status: r.status,
        error: r.error
      })))

      return new Response(
        JSON.stringify({ 
          success: true,
          races: processedRaces
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