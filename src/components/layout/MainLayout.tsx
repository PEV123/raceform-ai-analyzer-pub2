import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";

interface NavItemProps {
  href: string;
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

const NavItem = ({ href, children, requiresAdmin }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;
  const { isAdmin, isLoading } = useAdmin();

  // If the item requires admin access and we're still loading or user is not admin,
  // don't render the item
  if (requiresAdmin && (isLoading || !isAdmin)) {
    return null;
  }

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
                  <NavItem href="/admin" requiresAdmin>Admin</NavItem>
                  {location.pathname.startsWith('/admin') && (
                    <NavItem href="/admin/race-documents" requiresAdmin>Race Documents</NavItem>
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