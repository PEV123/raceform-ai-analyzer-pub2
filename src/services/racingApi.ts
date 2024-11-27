import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

export const fetchTodaysRaces = async () => {
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

  return data.races;
};