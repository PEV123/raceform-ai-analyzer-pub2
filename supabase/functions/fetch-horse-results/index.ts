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
    const { horseId, type } = await req.json()
    console.log('Fetching horse data:', { horseId, type })

    if (!horseId) {
      throw new Error('Horse ID is required')
    }

    if (!RACING_API_USERNAME || !RACING_API_PASSWORD) {
      throw new Error('Racing API credentials not configured')
    }

    // Construct the appropriate endpoint based on type
    const endpoint = type === 'distance-analysis'
      ? `${RACING_API_BASE_URL}/horses/${horseId}/analysis/distance-times`
      : `${RACING_API_BASE_URL}/horses/${horseId}/results`

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
    console.log('Successfully fetched horse data')

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
    console.error('Error in fetch-horse-results function:', error)
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