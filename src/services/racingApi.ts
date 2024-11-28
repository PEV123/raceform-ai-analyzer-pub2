import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

export const fetchTodaysRaces = async () => {
  // Always format in UK timezone for API requests
  const ukFormattedDate = formatInTimeZone(new Date(), 'Europe/London', 'yyyy-MM-dd');
  console.log('Fetching today\'s races (UK time):', ukFormattedDate);
  return fetchRacesForDate(new Date());
};

export const fetchRacesForDate = async (date: Date) => {
  // Format the date in UK timezone for the API request
  const ukFormattedDate = formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
  console.log('Fetching races for UK date:', ukFormattedDate);

  const { data, error } = await supabase.functions.invoke('fetch-races-by-date', {
    body: {
      date: ukFormattedDate,
      timezone: 'Europe/London'
    },
  });

  if (error) {
    console.error('Error fetching races:', error);
    throw error;
  }

  // Log the raw API response for debugging
  console.log('Raw API response:', JSON.stringify(data, null, 2));
  
  if (!data.races || !Array.isArray(data.races)) {
    console.warn('No races found in API response');
    return [];
  }

  // Log each race's off_time for debugging
  data.races.forEach((race: any) => {
    console.log(`Race at ${race.course}: off_time = ${race.off_time}`);
  });

  return data.races;
};