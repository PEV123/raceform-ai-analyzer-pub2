import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface NavItemProps {
  href: string;
  children: React.ReactNode;
}

const NavItem = ({ href, children }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        "px-4 py-2 rounded-md transition-colors",
        isActive
          ? "bg-secondary text-secondary-foreground"
          : "hover:bg-muted text-foreground"
      )}
    >
      {children}
    </Link>
  );
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Checking auth in MainLayout:', session);
      
      if (error) {
        console.error('Auth check error:', error);
        return;
      }

      if (!session && location.pathname !== '/login') {
        console.log('No session found, redirecting to login');
        navigate('/login');
        return;
      }

      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in MainLayout:', event);
      setIsAuthenticated(!!session);
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('User signed out or deleted');
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
  }, [navigate, location.pathname, toast]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log('Sign out successful');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "There was an error signing out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              Racing Analysis
            </Link>
            <nav className="flex gap-4 items-center">
              <NavItem href="/">Today's Races</NavItem>
              <NavItem href="/analysis">Analysis</NavItem>
              {isAuthenticated ? (
                <>
                  <NavItem href="/admin">Admin</NavItem>
                  {location.pathname.startsWith('/admin') && (
                    <NavItem href="/admin/race-documents">Race Documents</NavItem>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default MainLayout;