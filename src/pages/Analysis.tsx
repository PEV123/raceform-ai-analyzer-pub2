import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RaceAnalysis } from "@/components/analysis/RaceAnalysis";
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

const Analysis = () => {
  const navigate = useNavigate();
  const { raceId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No session found");
      }

      const response = await fetch(
        "https://vlcrqrmqghskrdhhsgqt.supabase.co/functions/v1/cleanup-races",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cleanup races");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Cleaned up ${data.deletedRaces.length} duplicate races`,
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
    },
    onError: (error) => {
      console.error("Cleanup error:", error);
      toast({
        title: "Error",
        description: "Failed to cleanup races. Please make sure you're logged in.",
        variant: "destructive",
      });
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

  if (raceId) {
    return <RaceAnalysis raceId={raceId} />;
  }

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Race Analysis</h1>
        <div className="flex gap-4">
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
          <Button 
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            {cleanupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cleaning up...
              </>
            ) : (
              "Clean up duplicates"
            )}
          </Button>
        </div>
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

export default Analysis;