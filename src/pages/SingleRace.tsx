import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { RaceNavigation } from "@/components/race/RaceNavigation";
import { RaceDetails } from "@/components/race/RaceDetails";

type Race = Tables<"races"> & {
  runners: Tables<"runners">[];
};

const SingleRace = () => {
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: race, isLoading, error, refetch } = useQuery({
    queryKey: ["single-race"],
    enabled: false,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("races")
          .select(`
            *,
            runners (*)
          `)
          .single();

        if (error) {
          console.error("Error fetching race:", error);
          throw error;
        }
        
        console.log("Fetched race data:", data);
        return data as Race | null;
      } catch (error) {
        console.error("Error in query function:", error);
        throw error;
      }
    },
  });

  const handleRaceSelect = async (date: Date, venue: string, time: string) => {
    try {
      const targetDate = new Date(date);
      const [hours, minutes] = time.split(':');
      targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      console.log("Fetching race for:", {
        date: targetDate.toISOString(),
        venue,
        time
      });

      const { data, error } = await supabase
        .from("

I see the issue - the error occurs because we're not properly handling the race selection state in the SingleRace component. We need to store the selected date, venue, and time as state variables and use them in the query function. Let's fix this:

<lov-code>
Let's update the SingleRace.tsx file to properly handle the race selection:

<lov-write file_path="src/pages/SingleRace.tsx">
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { RaceNavigation } from "@/components/race/RaceNavigation";
import { RaceDetails } from "@/components/race/RaceDetails";
import { useState } from "react";

type Race = Tables<"races"> & {
  runners: Tables<"runners">[];
};

const SingleRace = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedVenue, setSelectedVenue] = useState<string>();
  const [selectedTime, setSelectedTime] = useState<string>();

  const { data: settings } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: race, isLoading, error } = useQuery({
    queryKey: ["single-race", selectedDate, selectedVenue, selectedTime],
    enabled: !!selectedDate && !!selectedVenue && !!selectedTime,
    queryFn: async () => {
      if (!selectedDate || !selectedVenue || !selectedTime) return null;

      const targetDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      console.log("Fetching race for:", targetDate, selectedVenue);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .eq('course', selectedVenue)
        .gte('off_time', targetDate.toISOString())
        .lt('off_time', new Date(targetDate.getTime() + 60000).toISOString())
        .maybeSingle();

      if (error) {
        console.error("Error fetching race:", error);
        throw error;
      }
      
      console.log("Fetched race data:", data);
      return data as Race | null;
    },
  });

  const handleRaceSelect = (date: Date, venue: string, time: string) => {
    setSelectedDate(date);
    setSelectedVenue(venue);
    setSelectedTime(time);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Race Finder</h1>
      </div>

      <RaceNavigation onRaceSelect={handleRaceSelect} />

      {error && (
        <div>Error loading race: {error.message}</div>
      )}

      {!race && !error && (
        <div>Please select a race using the navigation above.</div>
      )}

      {race && (
        <RaceDetails 
          race={race} 
          timezone={settings?.timezone || 'Europe/London'} 
          historicalResults={[]} 
        />
      )}
    </div>
  );
};

export default SingleRace;