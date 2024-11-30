import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';

export const useAdmin = () => {
  const session = useSession();
  const supabase = useSupabaseClient();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['admin-status', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.log('No user session found in useAdmin');
        return false;
      }
      
      console.log('Checking admin status for user:', session.user.id);
      
      // First check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile existence:', profileError);
        return false;
      }

      // If profile doesn't exist, create it
      if (!profile) {
        console.log('Profile not found, creating new profile for user:', session.user.id);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: session.user.id, is_admin: false }]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return false;
        }
        return false; // New profiles are not admin by default
      }

      // Now check admin status
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching admin status:', error);
        return false;
      }
      
      console.log('Admin status response:', data);
      return !!data?.is_admin;
    },
    enabled: !!session?.user?.id,
  });

  console.log('useAdmin hook result:', { isAdmin, isLoading, userId: session?.user?.id });

  return {
    isAdmin: !!isAdmin,
    isLoading,
  };
};