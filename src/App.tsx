import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Analysis from "./pages/Analysis";
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
      <SessionContextProvider supabaseClient={supabase}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/analysis" element={<Analysis />} />
                  <Route path="/analysis/:raceId" element={<Analysis />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/race-documents" element={<RaceDocuments />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/race" element={<SingleRace />} />
                </Routes>
              </MainLayout>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </SessionContextProvider>
    </React.StrictMode>
  );
};

export default App;