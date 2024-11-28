import { formatInTimeZone } from 'date-fns-tz';

interface RunnerFormProps {
  historicalResults: any[];
}

export const RunnerForm = ({ historicalResults }: RunnerFormProps) => {
  if (!historicalResults?.length) {
    return (
      <p className="text-sm text-muted-foreground italic">No recent form available</p>
    );
  }

  return (
    <div className="space-y-2">
      {historicalResults.slice(0, 5).map((result, index) => (
        <div 
          key={`${result.horse_id}-${result.race_id}-${index}`}
          className="bg-muted/50 p-3 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <span className="font-semibold">
              {result.position || '-'}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{result.course || '-'}</span>
                {result.class && (
                  <span className="text-sm text-muted-foreground">
                    ({result.class})
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {[
                  result.distance,
                  result.going && `(${result.going})`,
                  formatInTimeZone(new Date(result.date), 'Europe/London', 'dd/MM/yy'),
                  result.weight_lbs && `${result.weight_lbs}lbs`
                ].filter(Boolean).join(' • ')}
              </div>
              {result.winner && (
                <div className="text-sm mt-1">
                  <span className="font-medium">1st:</span> {result.winner}
                  {result.winner_weight_lbs && ` (${result.winner_weight_lbs}lbs)`}
                  {result.winner_btn && ` by ${result.winner_btn}`}
                </div>
              )}
              {result.comment && (
                <p className="text-sm text-muted-foreground mt-1 italic">
                  {result.comment}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};