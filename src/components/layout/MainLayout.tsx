import { ReactNode } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  usePageTracking();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/" className={navigationMenuTriggerStyle()}>
                  Home
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/analysis" className={navigationMenuTriggerStyle()}>
                  Analysis
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/admin" className={navigationMenuTriggerStyle()}>
                  Admin
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/login" className={navigationMenuTriggerStyle()}>
                  Login
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};