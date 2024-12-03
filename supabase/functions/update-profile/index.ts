import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface ProfileUpdatePayload {
  id: string
  full_name?: string | null
  email?: string | null
  membership_level?: string
  subscription_status?: string
  phone?: string | null
  company?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  postal_code?: string | null
  notes?: string | null
  updated_at: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const payload = await req.json() as ProfileUpdatePayload
    console.log('Received update payload:', payload)

    // Ensure required fields have default values
    const updateData = {
      ...payload,
      membership_level: payload.membership_level || 'free',
      subscription_status: payload.subscription_status || 'active',
      updated_at: new Date().toISOString(),
    }
    delete updateData.id // Remove id from update payload

    console.log('Processing update with data:', updateData)

    const { data, error } = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', payload.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    console.log('Profile updated successfully:', data)

    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in update-profile function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})