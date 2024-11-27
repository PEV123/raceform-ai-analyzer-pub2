import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResultsTableProps {
  results: any[];
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Distance</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Going</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result, index) => (
          <TableRow key={index}>
            <TableCell>{result.date}</TableCell>
            <TableCell>{result.course}</TableCell>
            <TableCell>{result.distance}</TableCell>
            <TableCell>{result.position}</TableCell>
            <TableCell>{result.going}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};