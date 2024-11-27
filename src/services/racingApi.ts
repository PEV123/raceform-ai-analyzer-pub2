import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';

export const fetchTodaysRaces = async (timezone: string = 'Europe/London') => {
  const today = new Date();
  return fetchRacesForDate(today, timezone);
};

export const fetchRacesForDate = async (date: Date, timezone: string = 'Europe/London') => {
  const formattedDate = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  console.log('Fetching races for date:', formattedDate, 'in timezone:', timezone);

  const { data, error } = await supabase.functions.invoke('fetch-races-by-date', {
    body: { 
      date: formattedDate,
      timezone: timezone
    }
  });

  if (error) {
    console.error('Error fetching races:', error);
    throw error;
  }

  if (!data || !data.races) {
    console.error('Invalid response format:', data);
    throw new Error('Invalid response from Racing API');
  }

  console.log('Successfully fetched races:', data.races);
  return data.races;
};