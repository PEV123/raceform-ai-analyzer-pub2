import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInTimeZone } from 'date-fns-tz';

interface ResultsTableProps {
  results: any[];
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  console.log("Rendering results table with data:", results);

  if (!results?.length) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No historical results found for this horse.
      </div>
    );
  }

  const formatDate = (date: string) => {
    return formatInTimeZone(new Date(date), 'Europe/London', 'dd/MM/yyyy');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Distance</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Going</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Winner</TableHead>
          <TableHead>Comment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result, index) => (
          <TableRow key={`${result.horse_id}-${result.race_id}-${index}`}>
            <TableCell>{formatDate(result.date)}</TableCell>
            <TableCell>{result.course || '-'}</TableCell>
            <TableCell>{result.distance || '-'}</TableCell>
            <TableCell>{result.class || '-'}</TableCell>
            <TableCell>{result.going || '-'}</TableCell>
            <TableCell>{result.position || '-'}</TableCell>
            <TableCell>{result.winner || '-'}</TableCell>
            <TableCell>{result.comment || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};