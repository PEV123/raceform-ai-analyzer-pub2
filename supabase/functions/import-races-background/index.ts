import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 5; // Process 5 races in parallel
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { date } = await req.json()
    console.log('Starting background import for date:', date)

    // Validate and format API URL
    let apiUrl = Deno.env.get('RACING_API_URL')
    if (!apiUrl) {
      throw new Error('RACING_API_URL environment variable is not set')
    }
    
    // Remove trailing slash if present
    apiUrl = apiUrl.replace(/\/$/, '')
    // Add /v1 if not present
    if (!apiUrl.endsWith('/v1')) {
      apiUrl = `${apiUrl}/v1`
    }
    console.log('Using API URL:', apiUrl)

    const apiUsername = Deno.env.get('RACING_API_USERNAME')
    const apiPassword = Deno.env.get('RACING_API_PASSWORD')
    if (!apiUsername || !apiPassword) {
      throw new Error('Racing API credentials are not properly configured')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a job record to track progress
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        date,
        status: 'processing',
        progress: 0
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating import job:', jobError)
      throw jobError
    }

    console.log('Created import job:', job.id)

    // Fetch races from API
    const raceUrl = `${apiUrl}/racecards/pro?date=${date}`
    console.log('Fetching races from:', raceUrl)
    
    const response = await fetch(
      raceUrl,
      {
        headers: {
          'Authorization': `Basic ${btoa(
            `${apiUsername}:${apiPassword}`
          )}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    console.log('Raw API Response:', JSON.stringify(data, null, 2))
    
    // Handle empty response
    if (!data) {
      console.log('No data returned from API')
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          progress: 100,
          summary: {
            message: 'No races found for this date'
          }
        })
        .eq('id', job.id)

      return new Response(
        JSON.stringify({ success: true, jobId: job.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // The API returns racecards directly or nested in data
    let races = []
    if (data.racecards && Array.isArray(data.racecards)) {
      console.log('Found races in data.racecards')
      races = data.racecards
    } else if (data.data?.racecards && Array.isArray(data.data.racecards)) {
      console.log('Found races in data.data.racecards')
      races = data.data.racecards
    } else {
      console.log('No valid races array found in response')
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'completed',
          progress: 100,
          summary: {
            message: 'No races found in API response'
          }
        })
        .eq('id', job.id)

      return new Response(
        JSON.stringify({ success: true, jobId: job.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${races.length} races to process`)

    // Process races in batches
    for (let i = 0; i < races.length; i += BATCH_SIZE) {
      const batch = races.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(async (race) => {
        try {
          // Process race logic here
          console.log(`Processing race at ${race.course}`)
          
          // Update progress
          const progress = Math.min(100, Math.round(((i + BATCH_SIZE) / races.length) * 100))
          await supabase
            .from('import_jobs')
            .update({ 
              progress,
              status: progress === 100 ? 'completed' : 'processing'
            })
            .eq('id', job.id)

        } catch (error) {
          console.error(`Error processing race:`, error)
          throw error
        }
      }))
    }

    return new Response(
      JSON.stringify({ success: true, jobId: job.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})