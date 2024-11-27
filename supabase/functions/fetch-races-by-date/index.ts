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
    
    console.log('API Response:', JSON.stringify(data, null, 2))
    
    if (!data.races || !Array.isArray(data.races)) {
      console.error('Invalid races data structure:', data)
      throw new Error('Invalid races data received from API')
    }

    const processedRaces = []
    
    // Process and insert races
    for (const race of data.races) {
      console.log(`Processing race at ${race.course} - ${race.off_time}`)

      try {
        // Check if race already exists
        const { data: existingRace, error: checkError } = await supabase
          .from("races")
          .select("id")
          .eq("race_id", race.race_id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`Error checking existing race ${race.race_id}:`, checkError)
          continue
        }

        if (existingRace) {
          console.log(`Race ${race.race_id} already exists, skipping`)
          processedRaces.push({ ...race, status: 'skipped' })
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
          console.error(`Error inserting race ${race.race_id}:`, raceError)
          processedRaces.push({ ...race, status: 'error', error: raceError.message })
          continue
        }

        console.log(`Successfully inserted race: ${raceData.id}`)
        processedRaces.push({ ...race, status: 'inserted', db_id: raceData.id })

        // Process runners
        if (race.runners && Array.isArray(race.runners)) {
          for (const runner of race.runners) {
            try {
              if (!runner.horse_id || !runner.horse) {
                console.warn(`Invalid runner data for race ${race.race_id}:`, runner)
                continue
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
                console.error(`Error inserting runner ${runner.horse_id}:`, runnerError)
                continue
              }

              console.log(`Successfully inserted runner ${runner.horse_id}`)

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
        processedRaces.push({ ...race, status: 'error', error: error.message })
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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
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