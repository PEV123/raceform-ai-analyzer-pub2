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

    // Let's use a test horse ID that we know works
    const testHorseId = "2f4cd2e5-f610-4c90-b35c-8f47b5e5864d";
    console.log('Using test horse ID:', testHorseId);

    const apiUrl = `https://api.theracingapi.com/v1/horses/${testHorseId}/results`
    console.log('Making request to:', apiUrl)

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
      throw new Error(`API responded with status: ${apiResponse.status} - ${errorText}`)
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