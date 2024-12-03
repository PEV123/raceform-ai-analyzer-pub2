import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";

interface RaceResultsProps {
  raceResult: Tables<"race_results"> & {
    runner_results: Tables<"runner_results">[];
  };
}

export const RaceResults = ({ raceResult }: RaceResultsProps) => {
  if (!raceResult) return null;

  const sortedRunners = raceResult.runner_results?.sort((a, b) => {
    const posA = parseInt(a.position || '999');
    const posB = parseInt(b.position || '999');
    return posA - posB;
  });

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-semibold mb-4">Race Result</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">Winning Time:</span> {raceResult.winning_time_detail}</p>
            <p><span className="font-medium">Going:</span> {raceResult.going}</p>
          </div>
          <div>
            <p><span className="font-medium">Tote Win:</span> {raceResult.tote_win}</p>
            <p><span className="font-medium">Tote Places:</span> {raceResult.tote_pl}</p>
          </div>
        </div>

        <div className="space-y-2">
          {sortedRunners?.map((runner) => (
            <div 
              key={runner.id}
              className="p-2 bg-muted rounded-lg flex items-center gap-4"
            >
              <div className="w-8 text-center font-bold">
                {runner.position || '-'}
              </div>
              <div className="flex-1">
                <div className="font-medium">{runner.horse}</div>
                <div className="text-sm text-muted-foreground">
                  {runner.jockey} ({runner.weight}) | SP: {runner.sp}
                </div>
                {runner.comment && (
                  <div className="text-sm mt-1">{runner.comment}</div>
                )}
              </div>
              <div className="text-sm text-right">
                {runner.btn !== '0' && (
                  <div>{runner.btn}L</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {raceResult.tote_ex && (
          <div className="mt-4 text-sm space-y-1">
            <p><span className="font-medium">Exacta:</span> {raceResult.tote_ex}</p>
            {raceResult.tote_csf && <p><span className="font-medium">CSF:</span> {raceResult.tote_csf}</p>}
            {raceResult.tote_tricast && <p><span className="font-medium">Tricast:</span> {raceResult.tote_tricast}</p>}
            {raceResult.tote_trifecta && <p><span className="font-medium">Trifecta:</span> {raceResult.tote_trifecta}</p>}
          </div>
        )}
      </div>
    </Card>
  );
};