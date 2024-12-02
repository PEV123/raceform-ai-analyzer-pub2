import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

export const RaceList = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());

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

  const { data: races, isLoading } = useQuery({
    queryKey: ["races", date.toISOString()],
    queryFn: async () => {
      console.log("Fetching races for date:", date);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("races")
        .select("*")
        .gte('off_time', startOfDay.toISOString())
        .lte('off_time', endOfDay.toISOString())
        .order("off_time", { ascending: true });

      if (error) throw error;
      console.log("Fetched races:", data);
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const formatDateTime = (date: string) => {
    return formatInTimeZone(
      new Date(date),
      settings?.timezone || 'Europe/London',
      'dd/MM/yyyy'
    );
  };

  const formatTime = (date: string) => {
    return formatInTimeZone(
      new Date(date),
      settings?.timezone || 'Europe/London',
      'HH:mm'
    );
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
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

      {!races?.length ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No races found for this date.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Race Time</TableHead>
              <TableHead>Number Runners</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {races?.map((race) => (
              <TableRow key={race.id}>
                <TableCell>
                  {formatDateTime(race.off_time)}
                </TableCell>
                <TableCell>{race.course}</TableCell>
                <TableCell>
                  {formatTime(race.off_time)}
                </TableCell>
                <TableCell>{race.field_size}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => navigate(`/analysis/${race.id}`)}
                  >
                    AI Analysis
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};