import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { HelmetProvider } from "react-helmet-async";
import { PageSeo } from "./components/seo/PageSeo";
import { BodyScripts } from "./components/seo/BodyScripts";
import Index from "./pages/Index";
import Analysis from "./pages/Analysis";
import PublicAnalysis from "./pages/PublicAnalysis";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import SingleRace from "./pages/SingleRace";
import RaceDocuments from "./pages/RaceDocuments";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from "./integrations/supabase/client";
import React from 'react';

const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <HelmetProvider>
        <SessionContextProvider supabaseClient={supabase}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <BrowserRouter>
                <PageSeo />
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/analysis" element={<Analysis />} />
                    <Route path="/analysis/:raceId" element={<Analysis />} />
                    <Route path="/public-analysis" element={<PublicAnalysis />} />
                    <Route path="/public-analysis/:raceId" element={<PublicAnalysis />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/race-documents" element={<RaceDocuments />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/race" element={<SingleRace />} />
                  </Routes>
                </MainLayout>
                <BodyScripts />
              </BrowserRouter>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </QueryClientProvider>
        </SessionContextProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
};

export default App;