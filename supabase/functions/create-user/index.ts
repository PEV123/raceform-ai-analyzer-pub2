import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  membershipLevel: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    );

    const { email, password, fullName, membershipLevel } = await req.json() as CreateUserPayload;

    // Create user
    const { data: userData, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError) {
      throw createUserError;
    }

    // Update profile
    const { error: updateProfileError } = await supabaseClient
      .from('profiles')
      .update({
        full_name: fullName,
        membership_level: membershipLevel,
      })
      .eq('id', userData.user.id);

    if (updateProfileError) {
      throw updateProfileError;
    }

    return new Response(
      JSON.stringify({ user: userData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});