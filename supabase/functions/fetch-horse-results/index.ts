import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')

serve(async (req) => {
  try {
    const { horseId } = await req.json()
    
    if (!horseId) {
      return new Response(
        JSON.stringify({ error: 'Horse ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching results for horse:', horseId)

    const response = await fetch(
      `https://api.theracingapi.com/v1/horses/${horseId}/results`,
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)
        }
      }
    )

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})