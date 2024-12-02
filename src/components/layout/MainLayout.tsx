import { Outlet } from "react-router-dom";
import { usePageTracking } from "@/hooks/usePageTracking";

export const MainLayout = () => {
  usePageTracking();

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
};