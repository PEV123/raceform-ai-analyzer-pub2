import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts"

const RACING_API_USERNAME = Deno.env.get('RACING_API_USERNAME')
const RACING_API_PASSWORD = Deno.env.get('RACING_API_PASSWORD')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { raceId, type } = await req.json();
    console.log('Fetching race data:', { raceId, type });

    if (!raceId) {
      throw new Error('Race ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Use the correct API endpoint based on the type
    const endpoint = type === 'pro' 
      ? `https://api.theracingapi.com/v1/races/${raceId}/pro`
      : `https://api.theracingapi.com/v1/races/${raceId}`;

    console.log('Making request to Racing API endpoint:', endpoint);

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`),
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Racing API error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Racing API responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched race data');

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fetch-races function:', error);
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