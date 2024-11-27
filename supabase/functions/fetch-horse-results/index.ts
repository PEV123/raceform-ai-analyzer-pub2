import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { horseId } = await req.json()
    
    if (!horseId) {
      return new Response(
        JSON.stringify({ error: 'Horse ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching results for horse:', horseId)
    console.log('Using API credentials:', !!RACING_API_USERNAME, !!RACING_API_PASSWORD)

    if (!RACING_API_USERNAME || !RACING_API_PASSWORD) {
      throw new Error('API credentials are not configured')
    }

    // Get date range for the last year
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const apiUrl = `https://api.theracingapi.com/v1/horses/${horseId}/results?start_date=${startDate}&end_date=${endDate}`
    console.log('Full API URL being called:', apiUrl)
    
    const apiResponse = await fetch(
      apiUrl,
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`),
          'Accept': 'application/json'
        }
      }
    )

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API Error Response:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        body: errorText
      })

      // Try to parse the error response
      let errorMessage = 'Failed to fetch horse results'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.detail || errorMessage
      } catch {
        // If parsing fails, use the raw error text
        errorMessage = errorText
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: apiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await apiResponse.json()
    console.log('Successfully retrieved horse results')
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})