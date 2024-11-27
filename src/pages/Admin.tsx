import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceList } from "@/components/admin/RaceList";
import { useState } from "react";
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const Admin = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: races, isLoading } = useQuery({
    queryKey: ["races", selectedDate],
    queryFn: async () => {
      // Convert the selected date to start and end of day in UK time
      const ukStartOfDay = fromZonedTime(
        new Date(selectedDate.setHours(0, 0, 0, 0)),
        'Europe/London'
      );
      
      const ukEndOfDay = fromZonedTime(
        new Date(selectedDate.setHours(23, 59, 59, 999)),
        'Europe/London'
      );

      console.log("Fetching races between:", ukStartOfDay, "and", ukEndOfDay);
      
      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          race_documents (*)
        `)
        .gte("off_time", ukStartOfDay.toISOString())
        .lte("off_time", ukEndOfDay.toISOString())
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
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={
                  "w-[280px] justify-start text-left font-normal"
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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