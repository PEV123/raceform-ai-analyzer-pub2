import { ApiResponse } from './types.ts';

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')
const RACING_API_BASE_URL = 'https://api.theracingapi.com/v1'

export const fetchRacesFromApi = async (date: string): Promise<ApiResponse> => {
  console.log('Making request to Racing API for date:', date)
  
  // Construct the API URL for racecards/pro endpoint
  const apiUrl = `${RACING_API_BASE_URL}/racecards/pro?date=${date}`
  console.log('Full API URL:', apiUrl)
  console.log('Using credentials:', { 
    username: RACING_API_USERNAME?.slice(0,3) + '***',
    password: RACING_API_PASSWORD ? '***' : 'not set'
  })
  
  try {
    const authHeader = btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`);
    console.log('Auth header created (first 10 chars):', authHeader.slice(0, 10) + '***')
    
    const response = await fetch(
      apiUrl,
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json'
        }
      }
    )

    console.log('API Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Racing API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Raw API Response structure:', {
      hasRacecards: !!data.racecards,
      isArray: Array.isArray(data),
      keys: Object.keys(data),
      raceCount: data.racecards?.length || 'N/A',
      firstRace: data.racecards?.[0] ? {
        race_id: data.racecards[0].race_id,
        course: data.racecards[0].course,
        off_time: data.racecards[0].off_time
      } : 'No races found'
    })
    
    // Handle empty response
    if (!data) {
      console.log('No data returned from API')
      return { races: [] }
    }

    // The API returns racecards directly in the response for /pro endpoint
    let races = []
    if (data.racecards && Array.isArray(data.racecards)) {
      console.log('Found races in data.racecards')
      races = data.racecards
    } else if (Array.isArray(data)) {
      console.log('Found races in root array')
      races = data
    } else {
      console.log('No valid races array found in response')
      return { races: [] }
    }

    // Log each race's datetime fields for debugging
    races.forEach((race: any) => {
      console.log(`Race at ${race.course}:`, {
        off_time: race.off_time,
        off_dt: race.off_dt,
        race_id: race.race_id,
        runners: race.runners?.length || 0
      });
    });

    return { races }

  } catch (error) {
    console.error('Error fetching races from API:', error)
    throw error
  }
}