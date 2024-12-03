import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')
const RACING_API_BASE_URL = 'https://api.theracingapi.com/v1'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { raceId } = await req.json()
    console.log('Fetching race results:', { raceId })

    if (!raceId) {
      throw new Error('Race ID is required')
    }

    if (!RACING_API_USERNAME || !RACING_API_PASSWORD) {
      throw new Error('Racing API credentials not configured')
    }

    const endpoint = `${RACING_API_BASE_URL}/results/${raceId}`
    console.log('Making request to Racing API endpoint:', endpoint)

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Racing API error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: endpoint
      })
      
      const errorBody = await response.text()
      console.error('Racing API error response:', errorBody)
      
      throw new Error(`Racing API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched race results:', JSON.stringify(data, null, 2))

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in fetch-race-results function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    )
  }
})