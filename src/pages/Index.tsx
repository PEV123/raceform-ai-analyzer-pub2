import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from 'date-fns-tz';
import { useState } from "react";
import { DateSelector } from "@/components/race/DateSelector";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const today = formatInTimeZone(new Date(), 'Europe/London', 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Fetch races for the selected date
  const { data: races, isLoading: racesLoading } = useQuery({
    queryKey: ["races", selectedDate],
    queryFn: async () => {
      const startTime = `${selectedDate}T00:00:00.000Z`;
      const endTime = `${selectedDate}T23:59:59.999Z`;

      console.log("Fetching races between:", startTime, "and", endTime);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .gte('off_time', startTime)
        .lt('off_time', endTime)
        .order('off_time', { ascending: true });

      if (error) throw error;
      console.log("Fetched races:", data);
      return data;
    },
  });

  // Group races by venue
  const groupedRaces = races?.reduce((acc: Record<string, any[]>, race) => {
    const venue = race.course;
    if (!acc[venue]) {
      acc[venue] = [];
    }
    acc[venue].push(race);
    return acc;
  }, {}) || {};

  const formatTime = (date: string) => {
    return formatInTimeZone(new Date(date), 'Europe/London', 'HH:mm');
  };

  const handleRaceClick = (raceId: string) => {
    navigate(`/race?raceId=${raceId}`);
  };

  // Format the display date in UK timezone
  const displayDate = formatInTimeZone(new Date(selectedDate), 'Europe/London', 'MMMM do, yyyy');

  if (racesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Today's Races</h1>
        <DateSelector 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      {!races?.length ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No races found for {displayDate}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRaces).map(([venue, venueRaces]) => (
            <div key={venue} className="rounded-lg border bg-card">
              <div className="bg-muted px-4 py-3 rounded-t-lg border-b">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-lg font-semibold">{venue}</h2>
                  <span className="text-sm text-muted-foreground">
                    {venueRaces[0].type} | {venueRaces.length} races
                  </span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Race Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead className="text-right">Runners</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venueRaces.map((race: any) => (
                    <TableRow key={race.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {formatTime(race.off_time)}
                      </TableCell>
                      <TableCell>{race.race_name}</TableCell>
                      <TableCell>{race.race_class}</TableCell>
                      <TableCell>{race.distance}</TableCell>
                      <TableCell className="text-right">{race.runners?.length || 0}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleRaceClick(race.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;