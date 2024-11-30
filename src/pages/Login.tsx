import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAdmin } from '@/hooks/useAdmin';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading } = useAdmin();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking auth session:', error);
        toast({
          title: "Authentication Error",
          description: "There was an error checking your login status. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (session) {
        navigate('/admin');
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session) {
        // Check if user is admin after sign in
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          toast({
            title: "Error",
            description: "Could not verify admin status.",
            variant: "destructive"
          });
          return;
        }

        if (!data?.is_admin) {
          toast({
            title: "Access Denied",
            description: "You do not have admin privileges.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Success!",
          description: "You have been successfully logged in.",
        });
        navigate('/admin');
      }
      
      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "You have been successfully logged out.",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              button: { background: 'rgb(var(--primary))', color: 'white' },
              anchor: { color: 'rgb(var(--primary))' },
            }
          }}
          theme="light"
          providers={[]}
          magicLink={false}
          redirectTo={`${window.location.origin}/admin`}
        />
      </Card>
    </div>
  );
};

export default Login;