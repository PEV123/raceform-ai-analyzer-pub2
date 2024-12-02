import { Ban } from "lucide-react";
import { OddsDisplay } from "./OddsDisplay";

interface RunnersListProps {
  runners: any[];
}

export const RunnersList = ({ runners }: RunnersListProps) => {
  return (
    <div className="space-y-4">
      {runners.map((runner: any) => (
        <div 
          key={runner.horse_id}
          className={`p-2 bg-muted rounded-lg flex items-center gap-2 ${
            runner.is_non_runner ? 'opacity-50' : ''
          }`}
        >
          <div className="w-6 text-center font-bold">
            {runner.number}
            {runner.is_non_runner && (
              <span className="text-xs text-red-500 block">NR</span>
            )}
          </div>
          <div className="flex-1">
            <div className={`font-medium ${runner.is_non_runner ? 'line-through' : ''}`}>
              {runner.horse}
              {runner.is_non_runner && (
                <Ban className="inline-block ml-2 h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {runner.jockey} | {runner.trainer}
            </div>
          </div>
          {!runner.is_non_runner && <OddsDisplay odds={runner.odds} />}
        </div>
      ))}
    </div>
  );
};