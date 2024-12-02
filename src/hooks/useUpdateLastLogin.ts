import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@supabase/auth-helpers-react';

export const useUpdateLastLogin = () => {
  const session = useSession();

  useEffect(() => {
    const updateLastLogin = async () => {
      if (session?.user?.id) {
        console.log('Updating last login for user:', session.user.id);
        const { error } = await supabase
          .from('profiles')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);

        if (error) {
          console.error('Error updating last login:', error);
        }
      }
    };

    updateLastLogin();
  }, [session?.user?.id]);
};