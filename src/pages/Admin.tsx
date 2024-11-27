import { AdminSettings } from "@/components/admin/AdminSettings";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceList } from "@/components/admin/RaceList";
import ImportRaces from "@/components/admin/ImportRaces";
import { HorseResults } from "@/components/admin/HorseResults";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

const Admin = () => {
  const [date, setDate] = useState<Date>(new Date());

  const { data: races, isLoading } = useQuery({
    queryKey: ["races", date.toISOString()],
    queryFn: async () => {
      console.log('Fetching races data for date:', date);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          race_documents (*),
          runners (*)
        `)
        .gte('off_time', startOfDay.toISOString())
        .lte('off_time', endOfDay.toISOString())
        .order('off_time', { ascending: true });

      if (error) {
        console.error('Error fetching races:', error);
        throw error;
      }
      
      console.log('Successfully fetched races:', data);
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <ImportRaces />
          <AdminSettings />
          <HorseResults />
        </div>
        
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Race Documents</h2>
            {isLoading ? (
              <p>Loading races...</p>
            ) : !races?.length ? (
              <p>No races found for this date.</p>
            ) : (
              <RaceList races={races} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;