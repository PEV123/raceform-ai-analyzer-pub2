import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { date } = await req.json()
    console.log('Fetching races for date:', date)

    if (!date) {
      throw new Error('Date parameter is required')
    }

    if (!RACING_API_USERNAME || !RACING_API_PASSWORD) {
      throw new Error('Racing API credentials are not configured')
    }

    // Ensure the date is in YYYY-MM-DD format
    const formattedDate = new Date(date).toISOString().split('T')[0]
    console.log('Formatted date for API request:', formattedDate)

    const apiUrl = `https://api.theracingapi.com/v1/races/programme/${formattedDate}`
    console.log('Making request to Racing API URL:', apiUrl)

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
    console.log('Successfully fetched races for date:', formattedDate)

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