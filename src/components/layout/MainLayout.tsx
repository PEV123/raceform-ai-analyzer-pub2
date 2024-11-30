import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";

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
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session:', session);
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  console.log('Auth state:', { isAuthenticated, isAdmin });

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
              {isAuthenticated && (
                <>
                  {isAdmin && (
                    <>
                      <NavItem href="/admin">Admin</NavItem>
                      {location.pathname.startsWith('/admin') && (
                        <NavItem href="/admin/race-documents">Race Documents</NavItem>
                      )}
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/login');
                    }}
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