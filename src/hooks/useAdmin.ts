import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';

export const useAdmin = () => {
  const session = useSession();
  const supabase = useSupabaseClient();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['admin-status', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching admin status:', error);
        return false;
      }
      
      return data?.is_admin || false;
    },
    enabled: !!session?.user?.id,
  });

  return {
    isAdmin: !!isAdmin,
    isLoading,
  };
};