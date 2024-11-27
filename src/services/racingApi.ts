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

  return data.races;
};