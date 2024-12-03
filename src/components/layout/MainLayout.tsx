import { ReactNode } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./header/Header";
import { BodyScripts } from "../seo/BodyScripts";
import { PageSeo } from "../seo/PageSeo";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  usePageTracking();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 container mx-auto px-4 py-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <PageSeo />
      <BodyScripts />
      <Toaster />
      <Sonner />
    </div>
  );
};