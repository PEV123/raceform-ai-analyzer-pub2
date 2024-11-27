import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const fetchTodaysRaces = async () => {
  const today = new Date();
  return fetchRacesForDate(today);
};

export const fetchRacesForDate = async (date: Date) => {
  // Always format the date in UK timezone for the API request
  const formattedDate = formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
  console.log('Fetching races for date (UK time):', formattedDate);

  const { data, error } = await supabase.functions.invoke('fetch-races-by-date', {
    body: { 
      date: formattedDate
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