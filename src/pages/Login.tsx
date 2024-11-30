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
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Checking current session:', session);
      
      if (error) {
        console.error('Session check error:', error);
        return;
      }
      
      if (session?.user) {
        console.log('User already logged in:', session.user.email);
        navigate('/');
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('Sign in successful');
        toast({
          title: "Success!",
          description: "You have been successfully logged in.",
        });
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              button: { background: 'rgb(var(--primary))', color: 'white' },
              anchor: { color: 'rgb(var(--primary))' },
              container: { width: '100%' },
            }
          }}
          theme="light"
          providers={[]}
          redirectTo={window.location.origin}
        />
      </Card>
    </div>
  );
};

export default Login;