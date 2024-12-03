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

    console.log('Creating user with data:', { email, fullName, membershipLevel });

    // Create user
    const { data: userData, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      throw createUserError;
    }

    console.log('User created successfully:', userData.user.id);

    // Validate membership level
    const validMembershipLevels = ['free', 'premium', 'pro', 'admin'];
    if (!validMembershipLevels.includes(membershipLevel)) {
      throw new Error(`Invalid membership level. Must be one of: ${validMembershipLevels.join(', ')}`);
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
      console.error('Error updating profile:', updateProfileError);
      throw updateProfileError;
    }

    console.log('Profile updated successfully');

    return new Response(
      JSON.stringify({ user: userData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});