import { useQuery } from "@tanstack/react-query";
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

const Analysis = () => {
  const navigate = useNavigate();
  const { raceId } = useParams();

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
      <h1 className="text-3xl font-bold mb-8">Race Analysis</h1>
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