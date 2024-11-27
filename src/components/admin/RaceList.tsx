import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { formatInTimeZone } from 'date-fns-tz';

type Race = Tables<"races"> & {
  race_documents: Tables<"race_documents">[];
};

interface RaceListProps {
  races: Race[];
}

export const RaceList = ({ races }: RaceListProps) => {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  const formatUKTime = (date: string) => {
    return formatInTimeZone(new Date(date), 'Europe/London', 'HH:mm:ss');
  };

  // Create a Map to store unique races by their course and off_time combination
  const uniqueRaces = new Map<string, Race>();
  races.forEach(race => {
    const key = `${race.course}-${race.off_time}`;
    // If this race already exists in our Map, only update it if it has documents
    // (this ensures we keep the version with documents if it exists)
    if (!uniqueRaces.has(key) || race.race_documents?.length > 0) {
      uniqueRaces.set(key, race);
    }
  });

  // Convert the Map back to an array and sort by off_time
  const dedupedRaces = Array.from(uniqueRaces.values())
    .sort((a, b) => new Date(a.off_time).getTime() - new Date(b.off_time).getTime());

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venue</TableHead>
            <TableHead>Race</TableHead>
            <TableHead>Number Runners</TableHead>
            <TableHead>Non Runners</TableHead>
            <TableHead>Docs</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dedupedRaces.map((race) => (
            <TableRow key={race.id}>
              <TableCell>{race.course}</TableCell>
              <TableCell>
                {formatUKTime(race.off_time)}
              </TableCell>
              <TableCell>{race.field_size}</TableCell>
              <TableCell>0</TableCell>
              <TableCell>
                {race.race_documents?.length > 0 ? (
                  <div className="flex gap-2">
                    {race.race_documents.map((doc) => (
                      <img
                        key={doc.id}
                        src={`https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`}
                        alt={doc.file_name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ))}
                  </div>
                ) : (
                  "No documents"
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRace(race)}
                >
                  Upload Docs
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DocumentUploadDialog
        race={selectedRace}
        open={!!selectedRace}
        onOpenChange={(open) => !open && setSelectedRace(null)}
      />
    </>
  );
};
