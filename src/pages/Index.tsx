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
import { HorseHead } from "@/components/icons/HorseHead";
import { ScrollArea } from "@/components/ui/scroll-area";

const Index = () => {
  const navigate = useNavigate();
  const today = formatInTimeZone(new Date(), 'Europe/London', 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(today);

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

  const displayDate = formatInTimeZone(new Date(selectedDate), 'Europe/London', 'MMMM do, yyyy');

  if (racesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <HorseHead className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading races...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[100vw] px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div className="flex items-center gap-3">
          <HorseHead className="w-6 h-6 text-primary hidden sm:block" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Today's Races
          </h1>
        </div>
        <DateSelector 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      {!races?.length ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-muted/30 rounded-lg border border-dashed">
          <HorseHead className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No races found for {displayDate}.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedRaces).map(([venue, venueRaces]) => (
            <div key={venue} className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <div className="bg-muted px-4 py-3 border-b">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-lg font-semibold">{venue}</h2>
                  <span className="text-sm text-muted-foreground">
                    {venueRaces[0].type} • {venueRaces.length} {venueRaces.length === 1 ? 'race' : 'races'}
                  </span>
                </div>
              </div>
              <ScrollArea className="w-full">
                <div className="min-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Time</TableHead>
                        <TableHead>Race Name</TableHead>
                        <TableHead className="hidden md:table-cell">Class</TableHead>
                        <TableHead className="hidden md:table-cell">Distance</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Runners</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {venueRaces.map((race: any) => (
                        <TableRow 
                          key={race.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleRaceClick(race.id)}
                        >
                          <TableCell className="font-medium">
                            {formatTime(race.off_time)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {race.race_name}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {race.race_class}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {race.distance}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            {race.runners?.length || 0}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;