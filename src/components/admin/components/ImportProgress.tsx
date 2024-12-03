import { Progress } from "@/components/ui/progress";

interface ImportStats {
  totalRaces: number;
  successfulRaces: number;
  failedRaces: number;
  horseResults: {
    attempted: number;
    successful: number;
    failed: number;
  };
  distanceAnalysis: {
    attempted: number;
    successful: number;
    failed: number;
  };
}

interface ImportProgressProps {
  progress: number;
  operation: string;
  summary?: ImportStats;
}

export const ImportProgress = ({ progress, operation, summary }: ImportProgressProps) => {
  return (
    <div className="space-y-4">
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{operation}</p>
      
      {summary && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Races</h4>
              <ul className="list-none space-y-1">
                <li>Total: {summary.totalRaces}</li>
                <li>Successful: {summary.successfulRaces}</li>
                <li>Failed: {summary.failedRaces}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Horse Results</h4>
              <ul className="list-none space-y-1">
                <li>Attempted: {summary.horseResults.attempted}</li>
                <li>Successful: {summary.horseResults.successful}</li>
                <li>Failed: {summary.horseResults.failed}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Distance Analysis</h4>
              <ul className="list-none space-y-1">
                <li>Attempted: {summary.distanceAnalysis.attempted}</li>
                <li>Successful: {summary.distanceAnalysis.successful}</li>
                <li>Failed: {summary.distanceAnalysis.failed}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};