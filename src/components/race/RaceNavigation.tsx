import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface RaceNavigationProps {
  onRaceSelect: (date: Date, venue: string, time: string) => void;
}

export const RaceNavigation = ({ onRaceSelect }: RaceNavigationProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedVenue, setSelectedVenue] = useState<string>();
  const [selectedTime, setSelectedTime] = useState<string>();

  // Fetch all available dates
  const { data: raceDates } = useQuery({
    queryKey: ["race-dates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select("off_time")
        .order("off_time");

      if (error) throw error;

      // Get unique dates in UK timezone
      const uniqueDates = new Set(
        data.map((race) => formatInTimeZone(new Date(race.off_time), 'Europe/London', 'yyyy-MM-dd'))
      );
      return Array.from(uniqueDates).map((date) => new Date(date));
    },
  });

  // Fetch venues for selected date
  const { data: venues } = useQuery({
    queryKey: ["venues", selectedDate],
    enabled: !!selectedDate,
    queryFn: async () => {
      if (!selectedDate) return [];
      
      // Convert selected date to UK timezone range
      const ukDate = formatInTimeZone(selectedDate, 'Europe/London', 'yyyy-MM-dd');
      const startTime = `${ukDate}T00:00:00.000Z`;
      const endTime = `${ukDate}T23:59:59.999Z`;

      console.log('Fetching venues between:', startTime, 'and', endTime);

      const { data, error } = await supabase
        .from("races")
        .select("course")
        .gte("off_time", startTime)
        .lt("off_time", endTime)
        .order("course");

      if (error) throw error;

      // Get unique venues
      return Array.from(new Set(data.map((race) => race.course)));
    },
  });

  // Fetch race times for selected venue and date
  const { data: raceTimes } = useQuery({
    queryKey: ["race-times", selectedDate, selectedVenue],
    enabled: !!selectedDate && !!selectedVenue,
    queryFn: async () => {
      if (!selectedDate || !selectedVenue) return [];

      // Convert selected date to UK timezone range
      const ukDate = formatInTimeZone(selectedDate, 'Europe/London', 'yyyy-MM-dd');
      const startTime = `${ukDate}T00:00:00.000Z`;
      const endTime = `${ukDate}T23:59:59.999Z`;

      console.log('Fetching race times between:', startTime, 'and', endTime, 'for venue:', selectedVenue);

      const { data, error } = await supabase
        .from("races")
        .select("off_time")
        .eq("course", selectedVenue)
        .gte("off_time", startTime)
        .lt("off_time", endTime)
        .order("off_time");

      if (error) throw error;

      return data.map((race) => formatInTimeZone(new Date(race.off_time), 'Europe/London', 'HH:mm'));
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedVenue(undefined);
    setSelectedTime(undefined);
  };

  const handleVenueSelect = (venue: string) => {
    setSelectedVenue(venue);
    setSelectedTime(undefined);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate && selectedVenue) {
      onRaceSelect(selectedDate, selectedVenue, time);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Select Date</h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) =>
              !raceDates?.some(
                (raceDate) =>
                  formatInTimeZone(raceDate, 'Europe/London', 'yyyy-MM-dd') === 
                  formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd')
              )
            }
          />
        </div>

        {selectedDate && venues && venues.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Select Venue</h3>
            <Select
              value={selectedVenue}
              onValueChange={handleVenueSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((venue) => (
                  <SelectItem key={venue} value={venue}>
                    {venue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedVenue && raceTimes && raceTimes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Select Race Time</h3>
            <Select
              value={selectedTime}
              onValueChange={handleTimeSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {raceTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
};