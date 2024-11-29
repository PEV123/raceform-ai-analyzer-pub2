import { formatInTimeZone } from 'date-fns-tz';
import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { OddsTable } from "./OddsTable";

type Runner = Tables<"runners">;
type HorseResult = Tables<"horse_results">;

interface DetailedHorseFormProps {
  runner: Runner;
  historicalResults: HorseResult[];
}

export const DetailedHorseForm = ({ runner, historicalResults }: DetailedHorseFormProps) => {
  const formatDate = (date: string) => {
    return formatInTimeZone(new Date(date), 'Europe/London', 'dd/MM/yyyy');
  };

  // Calculate days since last race
  const calculateDaysSince = (raceDate: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(raceDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${days}d`;
  };

  // Sort results by date descending
  const sortedResults = [...historicalResults].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="p-4 mb-4">
      {/* Header Section */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
            {runner.number}
          </div>
          {runner.silk_url && (
            <img src={runner.silk_url} alt="Racing silks" className="w-8 h-8 object-contain" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{runner.horse}</h3>
          <p className="text-sm text-muted-foreground">
            T: {runner.trainer} J: {runner.jockey} ({runner.lbs}kg)
          </p>
          <OddsTable odds={runner.odds} />
        </div>
      </div>

      {/* Horse Details */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><span className="font-medium">Age:</span> {runner.age} years old</p>
          <p><span className="font-medium">Sire:</span> {runner.sire} ({runner.sire_region})</p>
          <p><span className="font-medium">Dam:</span> {runner.dam}</p>
          <p><span className="font-medium">Breeder:</span> {runner.breeder || 'Unknown'}</p>
        </div>
        <div>
          <p><span className="font-medium">Sex:</span> {runner.sex || 'Unknown'}</p>
          <p><span className="font-medium">Color:</span> {runner.colour || 'Unknown'}</p>
          {runner.dob && <p><span className="font-medium">Foaled:</span> {formatDate(runner.dob)}</p>}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
        <div>
          <p className="font-medium">Prizemoney</p>
          <p>£--</p>
        </div>
        <div>
          <p className="font-medium">Win Range</p>
          <p>--</p>
        </div>
        <div>
          <p className="font-medium">Win %</p>
          <p>--</p>
        </div>
        <div>
          <p className="font-medium">Place %</p>
          <p>--</p>
        </div>
      </div>

      {/* Track Performance */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
        <div>
          <p className="font-medium">1st Up</p>
          <p>--</p>
        </div>
        <div>
          <p className="font-medium">2nd Up</p>
          <p>--</p>
        </div>
        <div>
          <p className="font-medium">Track</p>
          <p>--</p>
        </div>
        <div>
          <p className="font-medium">Distance</p>
          <p>--</p>
        </div>
      </div>

      {/* Race History */}
      <div className="space-y-2">
        <h4 className="font-medium mb-3">Recent Form</h4>
        {sortedResults.map((result, index) => (
          <div key={`${result.horse_id}-${result.race_id}-${index}`} 
               className="grid grid-cols-[80px_1fr] gap-4 text-sm border-t pt-2">
            <div className="text-muted-foreground">
              {calculateDaysSince(result.date)}
            </div>
            <div>
              <div className="flex justify-between">
                <span className="font-medium">{result.course}</span>
                <span className="text-muted-foreground">
                  {result.distance || '--'} {result.class ? `(${result.class})` : ''}
                </span>
              </div>
              <div className="text-muted-foreground">
                {result.going && `Going: ${result.going}`}
              </div>
              <div className="mt-1">
                <span className="font-medium">
                  {result.position || '--'} 
                </span>
                {result.winner && (
                  <span className="text-muted-foreground ml-2">
                    Winner: {result.winner}
                    {result.winner_btn && ` (${result.winner_btn})`}
                  </span>
                )}
              </div>
              {result.comment && (
                <p className="text-sm text-muted-foreground mt-1">{result.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
