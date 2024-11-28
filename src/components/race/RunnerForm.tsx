import { formatInTimeZone } from 'date-fns-tz';

interface RunnerFormProps {
  historicalResults: any[];
}

export const RunnerForm = ({ historicalResults }: RunnerFormProps) => {
  console.log("Rendering RunnerForm with results:", historicalResults);

  if (!historicalResults?.length) {
    return (
      <p className="text-sm text-muted-foreground italic">No recent form available</p>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium mb-2">Recent Form:</p>
      {historicalResults.slice(0, 5).map((result, index) => (
        <div 
          key={`${result.horse_id}-${result.race_id}-${index}`}
          className="text-sm"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{result.course} ({result.going})</span>
            <span className="text-muted-foreground">
              {formatInTimeZone(new Date(result.date), 'Europe/London', 'dd/MM/yy')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};