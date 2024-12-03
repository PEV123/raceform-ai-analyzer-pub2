import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { formatInTimeZone } from "https://esm.sh/date-fns-tz@3.0.1";
import { parseISO } from "https://esm.sh/date-fns@2.30.0";

export const formatRaceDateTime = (raceDate: string, raceTime: string): string => {
  try {
    // Combine date and time
    const dateTimeStr = `${raceDate}T${raceTime}`;
    
    // Parse the combined string to a Date object
    const parsedDate = parseISO(dateTimeStr);
    
    // Format in UK timezone and ensure ISO format
    const formattedDate = formatInTimeZone(parsedDate, 'Europe/London', "yyyy-MM-dd'T'HH:mm:ssXXX");
    
    console.log('Formatted race datetime:', {
      input: { date: raceDate, time: raceTime },
      output: formattedDate
    });
    
    return formattedDate;
  } catch (error) {
    console.error('Error formatting race datetime:', error);
    throw error;
  }
};

export const prepareRaceData = (race: any) => {
  console.log('Preparing race data:', race);
  
  try {
    // Extract time from off_time if it exists
    const timeMatch = race.off_time?.match(/\d{2}:\d{2}/);
    const raceTime = timeMatch ? timeMatch[0] : '00:00';
    
    return {
      off_time: formatRaceDateTime(race.date || race.off_dt?.split('T')[0], raceTime),
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
    };
  } catch (error) {
    console.error('Error preparing race data:', error);
    throw error;
  }
};