import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceList } from "@/components/admin/RaceList";
import { useState } from "react";
import { formatInTimeZone } from 'date-fns-tz';

const Admin = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: races, isLoading } = useQuery({
    queryKey: ["races", selectedDate],
    queryFn: async () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log("Fetching races for date:", selectedDate);
      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          race_documents (*)
        `)
        .gte("off_time", startOfDay.toISOString())
        .lte("off_time", endOfDay.toISOString())
        .order('course')
        .order('off_time');

      if (error) {
        console.error("Error fetching races:", error);
        throw error;
      }

      // Sort races by venue and time
      const sortedData = data.sort((a, b) => {
        if (a.course !== b.course) {
          return a.course.localeCompare(b.course);
        }
        return new Date(a.off_time).getTime() - new Date(b.off_time).getTime();
      });

      console.log("Fetched races:", sortedData);
      return sortedData;
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <Card className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-semibold">Select Date</h2>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Races</h2>
        {isLoading ? (
          <p>Loading races...</p>
        ) : !races?.length ? (
          <p>No races found for selected date.</p>
        ) : (
          <RaceList races={races} />
        )}
      </Card>
    </div>
  );
};

export default Admin;