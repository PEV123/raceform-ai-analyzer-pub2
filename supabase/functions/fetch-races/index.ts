import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RACING_API_BASE_URL = "https://api.theracingapi.com/v1"
const RACING_API_USERNAME = "Gj48KGaBbt6ChEW1fiENkB59"
const RACING_API_PASSWORD = "5v1KqVnUT3xfqBZmD4IEOdaM"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    console.log("Edge function received request to fetch races")
    
    const authHeader = btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)
    
    const response = await fetch(
      `${RACING_API_BASE_URL}/racecards/basic?day=today`,
      {
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      console.error("Error fetching races:", response.statusText)
      const errorBody = await response.text()
      console.error("Error body:", errorBody)
      throw new Error(`Failed to fetch races: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Successfully fetched races data")
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Error in edge function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    )
  }
})