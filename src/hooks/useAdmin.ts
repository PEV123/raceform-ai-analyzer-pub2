import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

export const useAdmin = () => {
  const session = useSession();
  const supabase = useSupabaseClient();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['admin-status', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.log('No session or user ID available');
        return false;
      }
      
      console.log('Checking admin status for user ID:', session.user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching admin status:', error);
        toast({
          title: "Error",
          description: "Could not verify admin status. Please try logging out and back in.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('Admin status response:', data);
      return !!data?.is_admin;
    },
    enabled: !!session?.user?.id,
  });

  return {
    isAdmin: !!isAdmin,
    isLoading,
  };
};