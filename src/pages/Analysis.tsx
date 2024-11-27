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
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Analysis = () => {
  const navigate = useNavigate();
  const { raceId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    queryKey: ["races"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select("*")
        .order("off_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (raceId) {
    return <RaceAnalysis raceId={raceId} />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Race Analysis</h1>
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
                {format(new Date(race.off_time), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>{race.course}</TableCell>
              <TableCell>
                {format(new Date(race.off_time), "HH:mm")}
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
    </div>
  );
};

export default Analysis;