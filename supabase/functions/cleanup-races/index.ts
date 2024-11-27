import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all races with their documents
    const { data: races, error: fetchError } = await supabase
      .from('races')
      .select('*, race_documents(*)')

    if (fetchError) throw fetchError

    // Group races by course and off_time
    const raceGroups = new Map()
    races.forEach(race => {
      const key = `${race.course}-${race.off_time}`
      if (!raceGroups.has(key)) {
        raceGroups.set(key, [])
      }
      raceGroups.get(key).push(race)
    })

    // For each group, keep the race with documents or the first one if none have documents
    const racesToDelete = []
    raceGroups.forEach(group => {
      if (group.length > 1) {
        // Sort to prioritize races with documents
        group.sort((a, b) => (b.race_documents?.length || 0) - (a.race_documents?.length || 0))
        // Keep the first race (with documents if any exist)
        const raceToKeep = group[0]
        // Mark the rest for deletion
        group.slice(1).forEach(race => racesToDelete.push(race.id))
      }
    })

    // Delete duplicate races
    if (racesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('races')
        .delete()
        .in('id', racesToDelete)

      if (deleteError) throw deleteError
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully cleaned up ${racesToDelete.length} duplicate races`,
        deletedRaces: racesToDelete 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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
