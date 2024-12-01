import { Button } from "@/components/ui/button";
import { FileJson, History, ExternalLink, Eye, BarChart2, CheckCircle, Database } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type Race = Tables<"races"> & {
  runners: Tables<"runners">[];
};

interface RaceActionButtonsProps {
  race: Race;
  onUploadDocs: () => void;
  onViewRawData: () => void;
  onViewDbData: () => void;
  onImportHorseResults: () => void;
  onImportDistanceAnalysis: () => void;
  hasImportedResults: boolean;
  hasImportedAnalysis: boolean;
  isImportingResults: boolean;
  isImportingAnalysis: boolean;
}

export const RaceActionButtons = ({
  race,
  onUploadDocs,
  onViewRawData,
  onViewDbData,
  onImportHorseResults,
  onImportDistanceAnalysis,
  hasImportedResults,
  hasImportedAnalysis,
  isImportingResults,
  isImportingAnalysis,
}: RaceActionButtonsProps) => {
  const navigate = useNavigate();

  const handleViewRace = () => {
    navigate(`/analysis/${race.id}`);
  };

  const handleViewRaceCard = () => {
    navigate(`/race?raceId=${race.id}`);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onUploadDocs}>
        Upload Docs
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onViewRawData}
        title="View Raw Data"
      >
        <FileJson className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onViewDbData}
        title="View Database Data"
      >
        <Database className="h-4 w-4" />
      </Button>
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={onImportHorseResults}
          disabled={isImportingResults}
          title="Import Horse Results"
        >
          <History className="h-4 w-4" />
        </Button>
        {hasImportedResults && (
          <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
        )}
      </div>
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={onImportDistanceAnalysis}
          disabled={isImportingAnalysis}
          title="Import Distance Analysis"
        >
          <BarChart2 className="h-4 w-4" />
        </Button>
        {hasImportedAnalysis && (
          <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
        )}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleViewRace}
        title="View Race Analysis"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleViewRaceCard}
        title="View Race Card"
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  );
};