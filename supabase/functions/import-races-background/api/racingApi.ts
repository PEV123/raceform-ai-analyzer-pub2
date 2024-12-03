const RACING_API_URL = Deno.env.get('RACING_API_URL') || '';
const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME') || '';
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD') || '';

export async function fetchFromRacingApi(endpoint: string) {
  console.log(`Making request to Racing API: ${endpoint}`);
  
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API request failed: ${response.status} - ${errorText}`);
    throw new Error(`API request failed: ${response.status} at ${endpoint}`);
  }

  return response.json();
}