const RACING_API_URL = Deno.env.get('RACING_API_URL') || '';
const API_USERNAME = Deno.env.get('RACING_API_USERNAME') || '';
const API_PASSWORD = Deno.env.get('RACING_API_PASSWORD') || '';

export async function fetchRacesFromApi(date: string, signal: AbortSignal) {
  console.log(`Fetching races from API for date ${date}`);
  
  const response = await fetch(
    `${RACING_API_URL}/racecards/pro?date=${date}`,
    {
      headers: {
        'Authorization': `Basic ${btoa(`${API_USERNAME}:${API_PASSWORD}`)}`,
        'Accept': 'application/json'
      },
      signal
    }
  );

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.racecards || data.data?.racecards || [];
}