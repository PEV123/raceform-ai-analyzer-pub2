import { ApiResponse } from './types.ts';

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')
const RACING_API_BASE_URL = 'https://api.theracingapi.com/v1'

export const fetchRacesFromApi = async (date: string): Promise<ApiResponse> => {
  console.log('Making request to Racing API for date:', date)
  
  // First, fetch from racecards/pro endpoint
  const apiUrl = `${RACING_API_BASE_URL}/racecards/pro?date=${date}`
  console.log('API URL:', apiUrl)
  
  try {
    const response = await fetch(
      apiUrl,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
          'Accept': 'application/json'
        }
      }
    )

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
    console.log('Raw API Response:', JSON.stringify(data, null, 2))
    
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