import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Race, Runner } from './types.ts'
import { format, parseISO } from 'https://esm.sh/date-fns@2'
import { formatInTimeZone } from 'https://esm.sh/date-fns-tz@2'

export const getSupabaseClient = () => {
  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  console.log('Supabase client initialized')
  return client
}

const formatTimestamp = (dateStr: string): string => {
  try {
    // First try parsing as ISO string
    const date = parseISO(dateStr)
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date from parseISO')
    }
    return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX")
  } catch (error) {
    console.error('Error parsing date:', dateStr, error)
    // If parsing fails, try to fix common format issues
    const fixedDate = dateStr
      .replace(/(\d{4}-\d{2}-\d{2})(?:T| )(\d{2}:\d{2})(?::00)?/, '$1T$2:00')
      .replace(/Z$/, '+00:00')
    
    console.log('Attempting with fixed date format:', fixedDate)
    const date = parseISO(fixedDate)
    if (isNaN(date.getTime())) {
      throw new Error(`Could not parse date: ${dateStr}`)
    }
    return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX")
  }
}

export const insertRace = async (supabase: any, race: Race) => {
  console.log(`Inserting race: ${race.course} - ${race.off_time}`)
  
  try {
    const formattedOffTime = formatTimestamp(race.off_time)
    console.log('Formatted off_time:', formattedOffTime)

    const { data: raceData, error: raceError } = await supabase
      .from("races")
      .insert({
        off_time: formattedOffTime,
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

    console.log('Successfully inserted race:', raceData.id)
    return raceData
  } catch (error) {
    console.error('Error in insertRace:', error)
    throw error
  }
}

export const insertRunner = async (supabase: any, raceId: string, runner: Runner) => {
  console.log(`Inserting runner ${runner.horse} for race ${raceId}`)
  
  try {
    const { error: runnerError } = await supabase
      .from("runners")
      .insert({
        race_id: raceId,
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
        trainer_14_days: runner.trainer_14_days || [],
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
      throw runnerError
    }

    console.log(`Successfully inserted runner ${runner.horse}`)
  } catch (error) {
    console.error(`Error in insertRunner:`, error)
    throw error
  }
}

export const insertHorseResult = async (supabase: any, horseId: string, result: any) => {
  console.log(`Inserting result for horse ${horseId}`)
  
  try {
    const formattedDate = formatTimestamp(result.off_dt)
    console.log('Formatted horse result date:', formattedDate)

    const { error: resultError } = await supabase
      .from('horse_results')
      .insert({
        horse_id: horseId,
        race_id: result.race_id,
        date: formattedDate,
        course: result.course,
        distance: result.dist,
        class: result.class,
        going: result.going,
        position: result.runners?.find((r: any) => r.horse_id === horseId)?.position,
        weight_lbs: result.runners?.find((r: any) => r.horse_id === horseId)?.weight_lbs,
        winner: result.runners?.find((r: any) => r.position === '1')?.horse,
        second: result.runners?.find((r: any) => r.position === '2')?.horse,
        third: result.runners?.find((r: any) => r.position === '3')?.horse,
        winner_weight_lbs: result.runners?.find((r: any) => r.position === '1')?.weight_lbs,
        second_weight_lbs: result.runners?.find((r: any) => r.position === '2')?.weight_lbs,
        third_weight_lbs: result.runners?.find((r: any) => r.position === '3')?.weight_lbs,
        winner_btn: result.runners?.find((r: any) => r.position === '1')?.btn,
        second_btn: result.runners?.find((r: any) => r.position === '2')?.btn,
        third_btn: result.runners?.find((r: any) => r.position === '3')?.btn,
        comment: result.runners?.find((r: any) => r.horse_id === horseId)?.comment
      })

    if (resultError) {
      console.error('Error inserting result:', resultError)
      throw resultError
    }

    console.log(`Successfully inserted result for horse ${horseId}`)
  } catch (error) {
    console.error(`Error in insertHorseResult:`, error)
    throw error
  }
}