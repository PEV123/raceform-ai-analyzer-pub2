import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RACING_API_BASE_URL = "https://api.theracingapi.com/v1"
const RACING_API_USERNAME = Deno.env.get("RACING_API_USERNAME")
const RACING_API_PASSWORD = Deno.env.get("RACING_API_PASSWORD")

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
    
    if (!RACING_API_USERNAME || !RACING_API_PASSWORD) {
      throw new Error("Racing API credentials not configured")
    }
    
    const authHeader = btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)
    
    console.log("Fetching races from Racing API...")
    const response = await fetch(
      `${RACING_API_BASE_URL}/racecards/pro?day=today`,
      {
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      console.error("Error response from Racing API:", response.status, response.statusText)
      const errorBody = await response.text()
      console.error("Error body:", errorBody)
      throw new Error(`Racing API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Successfully fetched races from Racing API")
    
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