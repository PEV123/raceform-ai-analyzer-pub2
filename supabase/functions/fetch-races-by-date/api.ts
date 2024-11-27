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
    console.log('Raw API Response:', data)
    
    // Validate response structure
    if (!data) {
      console.error('Empty API response')
      throw new Error('Empty API response')
    }

    // Check if data.data exists (API might wrap response in data field)
    const raceData = data.data || data
    console.log('Processed race data:', raceData)

    if (!raceData.races && !raceData.racecards) {
      console.error('Invalid API response structure:', raceData)
      throw new Error('Invalid API response: missing races field')
    }

    // Handle different possible response structures
    const races = raceData.races || raceData.racecards || []
    
    if (!Array.isArray(races)) {
      console.error('Races is not an array:', races)
      throw new Error('Invalid API response: races is not an array')
    }

    console.log(`Successfully fetched ${races.length} races`)
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