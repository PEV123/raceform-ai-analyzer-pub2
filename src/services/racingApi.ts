import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay } from "date-fns";

export const fetchTodaysRaces = async () => {
  const today = startOfDay(new Date());
  console.log('Fetching today\'s races:', format(today, 'yyyy-MM-dd'));
  return fetchRacesForDate(today);
};

export const fetchRacesForDate = async (date: Date) => {
  // Ensure we're working with the start of the day
  const targetDate = startOfDay(date);
  const formattedDate = format(targetDate, 'yyyy-MM-dd');
  console.log('Fetching races for date:', formattedDate);

  const { data, error } = await supabase.functions.invoke('fetch-races-by-date', {
    body: {
      date: formattedDate,
    },
  });

  if (error) {
    console.error('Error fetching races:', error);
    throw error;
  }

  return data.races;
};