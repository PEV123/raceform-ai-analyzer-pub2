import { ReactNode } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  usePageTracking();

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
};