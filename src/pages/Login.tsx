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
        console.log('User is already logged in:', session.user.email);
        // Let the useAdmin hook handle admin check and redirection
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('Sign in successful, redirecting...');
        toast({
          title: "Success!",
          description: "You have been successfully logged in.",
        });
        
        // The useAdmin hook will handle the admin check and redirect
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        toast({
          title: "Signed out",
          description: "You have been successfully logged out.",
        });
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Redirect to admin page if user is admin
  useEffect(() => {
    if (!isLoading) {
      console.log('Admin check completed. Is admin?', isAdmin);
      if (isAdmin) {
        console.log('User is admin, redirecting to admin page');
        navigate('/admin');
      } else if (!isLoading) {
        console.log('User is not an admin, redirecting to home');
        navigate('/');
      }
    }
  }, [isAdmin, isLoading, navigate]);

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
          redirectTo={`${window.location.origin}/admin`}
        />
      </Card>
    </div>
  );
};

export default Login;