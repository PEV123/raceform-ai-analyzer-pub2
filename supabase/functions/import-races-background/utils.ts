import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, parseISO } from "https://esm.sh/date-fns@3.3.1";
import { fromZonedTime } from "https://esm.sh/date-fns-tz@3.0.1";

export const formatRaceDateTime = (raceDate: string, raceTime: string): string => {
  try {
    // Extract time components
    const timeMatch = raceTime.match(/(\d{2}):(\d{2})/);
    if (!timeMatch) {
      console.error('Invalid time format:', raceTime);
      throw new Error('Invalid time format');
    }

    // Parse the date and combine with time
    const [hours, minutes] = timeMatch.slice(1);
    const dateObj = parseISO(raceDate);
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Convert to UTC while preserving the intended UK time
    const ukTime = fromZonedTime(dateObj, 'Europe/London');
    
    console.log('Formatted race datetime:', {
      input: { date: raceDate, time: raceTime },
      dateObj: dateObj.toISOString(),
      ukTime: ukTime.toISOString()
    });
    
    return ukTime.toISOString();
  } catch (error) {
    console.error('Error formatting race datetime:', error);
    throw error;
  }
};

export const prepareRaceData = (race: any) => {
  console.log('Preparing race data:', race);
  
  try {
    // Extract time from off_time if it exists, otherwise use a default
    const timeMatch = race.off_time?.match(/\d{2}:\d{2}/) || ['00:00'];
    const raceTime = timeMatch[0];
    
    // Use the date from off_dt if available, otherwise use the date field
    const raceDate = race.off_dt?.split('T')[0] || race.date;
    
    if (!raceDate) {
      console.error('No valid date found in race data:', race);
      throw new Error('No valid date found in race data');
    }

    return {
      off_time: formatRaceDateTime(raceDate, raceTime),
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