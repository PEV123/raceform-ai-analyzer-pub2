import { supabase } from "@/integrations/supabase/client";

export const fetchTodaysRaces = async () => {
  const response = await fetch('https://api.theracingapi.com/v1/races', {
    headers: {
      'Authorization': `Basic ${btoa(`${import.meta.env.VITE_RACING_API_USERNAME}:${import.meta.env.VITE_RACING_API_PASSWORD}`)}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch races: ${response.statusText}`);
  }

  const data = await response.json();
  return data.races;
};

export const fetchRacesForDate = async (date: Date) => {
  console.log('Fetching races for date:', date);
  const formattedDate = date.toISOString().split('T')[0];

  const response = await fetch(
    `https://api.theracingapi.com/v1/races?date=${formattedDate}`,
    {
      headers: {
        'Authorization': `Basic ${btoa(`${import.meta.env.VITE_RACING_API_USERNAME}:${import.meta.env.VITE_RACING_API_PASSWORD}`)}`,
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch races: ${response.statusText}`);
  }

  const data = await response.json();
  return data.races;
};
