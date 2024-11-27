import { supabase } from "@/integrations/supabase/client";

export const fetchTodaysRaces = async () => {
  const today = new Date().toISOString().split('T')[0];
  return fetchRacesForDate(new Date());
};

export const fetchRacesForDate = async (date: Date) => {
  console.log('Fetching races for date:', date);
  const formattedDate = date.toISOString().split('T')[0];

  const { data, error } = await supabase.functions.invoke('fetch-races-by-date', {
    body: { date: formattedDate }
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