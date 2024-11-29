import { Tables } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { convertTimeToSeconds, convertDistanceToFurlongs, formatSecondsPerFurlong } from "./horseDistanceUtils";

interface HorseDistanceTableProps {
  details: (Tables<"horse_distance_details"> & {
    horse_distance_times: Tables<"horse_distance_times">[];
  })[];
  currentRaceDistance?: string;
}

export const HorseDistanceTable = ({ details, currentRaceDistance }: HorseDistanceTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Distance</TableHead>
          <TableHead>Runs</TableHead>
          <TableHead>Win Rate</TableHead>
          <TableHead>Place Rate</TableHead>
          <TableHead>Pace (s/f)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {details.map((detail) => {
          let secondsPerFurlong = 0;
          let validTimeCount = 0;

          detail.horse_distance_times?.forEach(time => {
            if (time.time && time.time !== '-') {
              const seconds = convertTimeToSeconds(time.time);
              const furlongs = convertDistanceToFurlongs(detail.dist);
              if (seconds > 0 && furlongs > 0) {
                secondsPerFurlong += seconds / furlongs;
                validTimeCount++;
              }
            }
          });

          const avgSecondsPerFurlong = validTimeCount > 0 ? 
            secondsPerFurlong / validTimeCount : 0;

          const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;

          const isCurrentDistance = detail.dist === currentRaceDistance;

          return (
            <TableRow 
              key={detail.id}
              className={isCurrentDistance ? "bg-muted/50" : ""}
            >
              <TableCell>
                {detail.dist}
                {isCurrentDistance && (
                  <span className="ml-2 text-xs text-muted-foreground">(Today)</span>
                )}
              </TableCell>
              <TableCell>{detail.runs}</TableCell>
              <TableCell>{detail.win_percentage ? `${(Number(detail.win_percentage) * 100).toFixed(1)}%` : '0%'}</TableCell>
              <TableCell>{`${placeRate.toFixed(1)}%`}</TableCell>
              <TableCell>{formatSecondsPerFurlong(avgSecondsPerFurlong)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};