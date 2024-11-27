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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { horseName } = await req.json()
    
    if (!horseName) {
      return new Response(
        JSON.stringify({ error: 'Horse name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching results for horse:', horseName)
    
    if (!RACING_API_USERNAME || !RACING_API_PASSWORD) {
      throw new Error('API credentials are not configured')
    }

    const apiResponse = await fetch(
      `https://api.theracingapi.com/v1/horses/search?name=${encodeURIComponent(horseName)}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)}`,
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

      throw new Error(`Racing API error: ${apiResponse.statusText}`)
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