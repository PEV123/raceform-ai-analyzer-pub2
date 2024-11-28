import { ApiResponse } from './types.ts';

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')

export const fetchRacesFromApi = async (date: string): Promise<ApiResponse> => {
  console.log('Making request to Racing API for date:', date)
  
  const apiUrl = `https://api.theracingapi.com/v1/racecards/pro?date=${date}`
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

    // The API returns racecards directly or nested in data
    let races = []
    if (data.racecards && Array.isArray(data.racecards)) {
      console.log('Found races in data.racecards')
      races = data.racecards
    } else if (data.data?.racecards && Array.isArray(data.data.racecards)) {
      console.log('Found races in data.data.racecards')
      races = data.data.racecards
    } else {
      console.log('No valid races array found in response')
      return { races: [] }
    }

    // Log each race's datetime fields for debugging
    races.forEach((race: any) => {
      console.log(`Race at ${race.course}:`, {
        off_time: race.off_time,
        off_dt: race.off_dt
      });
    });

    return { races }

  } catch (error) {
    console.error('Error fetching races from API:', error)
    throw error
  }
}

export const fetchHorseResults = async (horseId: string) => {
  console.log('Fetching historical results for horse:', horseId)
  
  try {
    const response = await fetch(
      `https://api.theracingapi.com/v1/horses/${horseId}/results`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Error fetching horse results:', response.statusText)
      return null
    }

    const data = await response.json()
    console.log(`Fetched ${data.results?.length || 0} results for horse:`, horseId)
    return data
  } catch (error) {
    console.error(`Error fetching results for horse ${horseId}:`, error)
    return null
  }
}