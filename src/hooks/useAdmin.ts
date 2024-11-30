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