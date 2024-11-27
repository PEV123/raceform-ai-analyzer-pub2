const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')

export const fetchRacesFromApi = async (date: string) => {
  console.log('Making request to Racing API for date:', date)
  
  const apiUrl = `https://api.theracingapi.com/v1/racecards/pro?date=${date}`
  console.log('API URL:', apiUrl)
  
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
    throw new Error(`Racing API error: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('Successfully fetched races:', JSON.stringify(data, null, 2))
  return data
}

export const fetchHorseResults = async (horseId: string) => {
  console.log('Fetching historical results for horse:', horseId)
  
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
  console.log('Fetched results for horse:', horseId, JSON.stringify(data, null, 2))
  return data
}