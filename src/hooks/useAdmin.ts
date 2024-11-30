import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';

export const useAdmin = () => {
  const session = useSession();
  const supabase = useSupabaseClient();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['admin-status', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      
      console.log('Checking admin status for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle(); // Use maybeSingle() instead of single()
      
      if (error) {
        console.error('Error fetching admin status:', error);
        return false;
      }
      
      console.log('Admin status response:', data);
      return data?.is_admin || false;
    },
    enabled: !!session?.user?.id,
  });

  return {
    isAdmin: !!isAdmin,
    isLoading,
  };
};