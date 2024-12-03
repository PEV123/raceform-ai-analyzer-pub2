import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

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
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>
      
      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{operation}</p>
      
      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Races Progress</h4>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span>{summary.totalRaces}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Successful:</span>
                  <span className="text-green-600">{summary.successfulRaces}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed:</span>
                  <span className="text-red-600">{summary.failedRaces}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Horse Results</h4>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Attempted:</span>
                  <span>{summary.horseResults.attempted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Successful:</span>
                  <span className="text-green-600">{summary.horseResults.successful}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed:</span>
                  <span className="text-red-600">{summary.horseResults.failed}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Distance Analysis</h4>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Attempted:</span>
                  <span>{summary.distanceAnalysis.attempted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Successful:</span>
                  <span className="text-green-600">{summary.distanceAnalysis.successful}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed:</span>
                  <span className="text-red-600">{summary.distanceAnalysis.failed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};