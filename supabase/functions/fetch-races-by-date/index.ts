import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { date, timezone } = await req.json()
    console.log('Fetching races for date:', date, 'in timezone:', timezone)

    if (!date) {
      throw new Error('Date parameter is required')
    }

    if (!RACING_API_USERNAME || !RACING_API_PASSWORD) {
      throw new Error('Racing API credentials are not configured')
    }

    const apiUrl = `https://api.theracingapi.com/v1/racecards/pro?date=${date}`
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
    console.log('Successfully fetched races:', data)

    return new Response(
      JSON.stringify({ 
        races: data.races || [],
        timezone: timezone 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        races: [] 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})