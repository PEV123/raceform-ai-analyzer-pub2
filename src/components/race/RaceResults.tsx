import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { RaceResultsHeader } from "./results/RaceResultsHeader";
import { FinishingPost } from "./results/FinishingPost";
import { RunnerPosition } from "./results/RunnerPosition";
import { ToteResults } from "./results/ToteResults";

interface RaceResultsProps {
  raceResult: Tables<"race_results"> & {
    runner_results: Tables<"runner_results">[];
  };
}

export const RaceResults = ({ raceResult }: RaceResultsProps) => {
  if (!raceResult) return null;

  // Sort runners by position
  const sortedRunners = raceResult.runner_results?.sort((a, b) => {
    // Handle non-finishers (PU, etc) by placing them at the end
    const posA = parseInt(a.position) || 999;
    const posB = parseInt(b.position) || 999;
    return posA - posB;
  });

  // Calculate cumulative distances while keeping actual BTN values
  const runnersWithCumulative = sortedRunners.map((runner, index) => {
    let cumulativeDistance = 0;
    if (index > 0) {
      // For each horse, sum up all the distances of previous horses
      for (let i = 1; i <= index; i++) {
        const prevRunner = sortedRunners[i];
        const distance = parseFloat(prevRunner.btn || "0");
        if (!isNaN(distance)) {
          cumulativeDistance += distance;
        }
      }
    }
    return { ...runner, cumulativeDistance };
  });

  // Find maximum cumulative distance for scaling
  const maxCumulativeDistance = Math.max(
    ...runnersWithCumulative.map(r => r.cumulativeDistance || 0)
  );

  // Scale factor to ensure horses don't go off screen (80% of container width)
  // Multiply by 10 to make the visual gaps more pronounced
  const scaleFactor = (80 / (maxCumulativeDistance || 1)) * 10;

  return (
    <Card className="p-4 mb-4 bg-gradient-to-br from-secondary/5 to-accent/5">
      <RaceResultsHeader 
        winningTime={raceResult.winning_time_detail || '--'}
        going={raceResult.going || '--'}
        toteWin={raceResult.tote_win || '--'}
        totePlaces={raceResult.tote_pl || '--'}
      />

      {/* Visual representation of finishing positions */}
      <div className="relative h-[400px] mb-8 overflow-hidden border border-accent/20 rounded-lg bg-white/50 p-4">
        <FinishingPost />
        
        {runnersWithCumulative.map((runner, index) => {
          const position = parseInt(runner.position);
          if (isNaN(position)) return null;

          // Calculate horizontal position based on cumulative distance
          // Non-finishers go to the far right
          const xPosition = isNaN(parseFloat(runner.btn || ""))
            ? 100 // Non-finishers at the right edge
            : runner.cumulativeDistance * scaleFactor;
          
          return (
            <RunnerPosition
              key={runner.id}
              position={runner.position}
              horse={runner.horse}
              cumulativeDistance={runner.cumulativeDistance}
              xPosition={xPosition}
              index={index}
              isWinner={index === 0}
            />
          );
        })}
      </div>

      {/* Detailed results table */}
      <div className="space-y-3">
        {runnersWithCumulative.map((runner) => (
          <div 
            key={runner.id}
            className="p-3 bg-white/50 backdrop-blur rounded-lg shadow-sm hover:shadow-md transition-shadow border border-accent/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center font-bold text-accent">
                {runner.position || 'NR'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-primary">{runner.horse}</div>
                <div className="text-sm text-muted-foreground">
                  {runner.jockey} ({runner.weight}) | SP: {runner.sp}
                </div>
                {runner.comment && (
                  <div className="text-sm mt-1 text-muted-foreground italic">{runner.comment}</div>
                )}
              </div>
              <div className="text-sm text-right">
                {runner.cumulativeDistance > 0 && (
                  <div className="font-medium text-secondary">
                    {runner.cumulativeDistance.toFixed(1)}L behind
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ToteResults 
        toteEx={raceResult.tote_ex}
        toteCSF={raceResult.tote_csf}
        toteTricast={raceResult.tote_tricast}
        toteTrifecta={raceResult.tote_trifecta}
      />
    </Card>
  );
};
