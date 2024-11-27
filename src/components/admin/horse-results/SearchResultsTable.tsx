import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface SearchResultsTableProps {
  results: any[];
  onViewResults: (horseId: string) => void;
}

export const SearchResultsTable = ({ results, onViewResults }: SearchResultsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Horse ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Sire</TableHead>
          <TableHead>Dam</TableHead>
          <TableHead>Dam Sire</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((horse) => (
          <TableRow key={horse.id}>
            <TableCell>{horse.id}</TableCell>
            <TableCell>{horse.name}</TableCell>
            <TableCell>{horse.sire}</TableCell>
            <TableCell>{horse.dam}</TableCell>
            <TableCell>{horse.damsire}</TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewResults(horse.id)}
              >
                View Results
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};