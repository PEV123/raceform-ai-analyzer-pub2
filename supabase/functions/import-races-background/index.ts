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

    if (jobError) throw jobError

    // Fetch races from API
    const response = await fetch(
      `${Deno.env.get('RACING_API_URL')}/races?date=${date}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(
            `${Deno.env.get('RACING_API_USERNAME')}:${Deno.env.get('RACING_API_PASSWORD')}`
          )}`
        }
      }
    )

    const { races } = await response.json()
    console.log(`Found ${races.length} races to process`)

    // Process races in batches
    const processRace = async (race: any, retries = 0) => {
      try {
        // Process race logic here (similar to existing logic)
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .insert({
            // ... race data
          })
          .select()
          .single()

        if (raceError) throw raceError

        // Process runners
        if (race.runners?.length) {
          await Promise.all(
            race.runners.map(async (runner: any) => {
              // Process runner logic
            })
          )
        }

        return true
      } catch (error) {
        if (retries < MAX_RETRIES) {
          console.log(`Retrying race ${race.race_id}, attempt ${retries + 1}`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
          return processRace(race, retries + 1)
        }
        throw error
      }
    }

    // Process races in parallel batches
    for (let i = 0; i < races.length; i += BATCH_SIZE) {
      const batch = races.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(race => processRace(race)))
      
      // Update progress
      const progress = Math.min(100, Math.round(((i + BATCH_SIZE) / races.length) * 100))
      await supabase
        .from('import_jobs')
        .update({ progress, status: progress === 100 ? 'completed' : 'processing' })
        .eq('id', job.id)
    }

    return new Response(
      JSON.stringify({ success: true, jobId: job.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})