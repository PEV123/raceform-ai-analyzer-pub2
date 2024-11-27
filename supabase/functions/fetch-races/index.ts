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
      console.error("Racing API credentials not configured")
      throw new Error("Racing API credentials not configured")
    }
    
    const authHeader = btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`)
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log("Fetching races for date:", today);
    
    console.log("Fetching races from Racing API...")
    const response = await fetch(
      `${RACING_API_BASE_URL}/racecards/pro?date=${today}`,
      {
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    )

    // Log the response status and headers for debugging
    console.log("Racing API Response Status:", response.status)
    console.log("Racing API Response Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response from Racing API:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })

      // Try to parse error response as JSON if possible
      let errorBody
      try {
        errorBody = JSON.parse(errorText)
      } catch {
        errorBody = errorText
      }

      throw new Error(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        error: errorBody
      }))
    }

    const data = await response.json()
    console.log("Successfully fetched races from Racing API")
    
    // Validate the response structure
    if (!data || !Array.isArray(data.racecards)) {
      console.error("Invalid response structure:", data)
      throw new Error("Invalid response structure from Racing API")
    }
    
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
    
    // Format error message for client
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
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