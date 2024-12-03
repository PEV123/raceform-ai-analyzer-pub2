import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { HorseHead } from "@/components/icons/HorseHead";

interface RaceResultsProps {
  raceResult: Tables<"race_results"> & {
    runner_results: Tables<"runner_results">[];
  };
}

export const RaceResults = ({ raceResult }: RaceResultsProps) => {
  if (!raceResult) return null;

  const sortedRunners = raceResult.runner_results?.sort((a, b) => {
    // Handle non-finishers (PU, etc) by placing them at the end
    const posA = parseInt(a.position) || 999;
    const posB = parseInt(b.position) || 999;
    return posA - posB;
  });

  // Calculate cumulative distances
  const runnersWithCumulative = sortedRunners.map((runner, index) => {
    let cumulativeDistance = 0;
    if (index > 0) {
      // Sum up all the distances of previous horses
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

  // Scale factor to ensure horses don't go off screen (60% of container width)
  const scaleFactor = 60 / (maxCumulativeDistance || 1);

  return (
    <Card className="p-4 mb-4 bg-gradient-to-br from-secondary/5 to-accent/5">
      <h3 className="text-2xl font-bold mb-4 text-primary">Race Result</h3>
      
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="space-y-1">
          <p className="font-medium">Winning Time: <span className="text-secondary">{raceResult.winning_time_detail}</span></p>
          <p className="font-medium">Going: <span className="text-secondary">{raceResult.going}</span></p>
        </div>
        <div className="space-y-1 text-right">
          <p className="font-medium">Tote Win: <span className="text-success">{raceResult.tote_win}</span></p>
          <p className="font-medium">Places: <span className="text-success">{raceResult.tote_pl}</span></p>
        </div>
      </div>

      {/* Visual representation of finishing positions */}
      <div className="relative h-[400px] mb-8 overflow-hidden border border-accent/20 rounded-lg bg-white/50 p-4">
        {runnersWithCumulative.map((runner, index) => {
          const position = parseInt(runner.position);
          if (isNaN(position)) return null;

          // Calculate horizontal position based on cumulative distance
          const xPosition = runner.cumulativeDistance * scaleFactor;
          
          return (
            <motion.div
              key={runner.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ 
                x: isNaN(position) ? '100%' : xPosition,
                opacity: 1 
              }}
              transition={{ 
                duration: 1,
                delay: index * 0.2,
                type: "spring",
                stiffness: 50
              }}
              className="absolute flex items-center gap-2"
              style={{ 
                top: `${index * 60 + 20}px`,
                left: 20 // Starting position
              }}
            >
              <div className="relative">
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: index * 0.1,
                  }}
                  className="w-12 h-12"
                >
                  <HorseHead className="w-full h-full text-accent" />
                </motion.div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
                  {position}
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 min-w-[200px]">
                <div className="font-medium text-primary">{runner.horse}</div>
                <div className="text-xs text-muted-foreground">
                  {runner.cumulativeDistance > 0 
                    ? `${runner.cumulativeDistance.toFixed(1)}L behind winner` 
                    : 'Winner'}
                </div>
              </div>
            </motion.div>
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

      {raceResult.tote_ex && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-1 text-sm">
          <p><span className="font-medium">Exacta:</span> {raceResult.tote_ex}</p>
          {raceResult.tote_csf && <p><span className="font-medium">CSF:</span> {raceResult.tote_csf}</p>}
          {raceResult.tote_tricast && <p><span className="font-medium">Tricast:</span> {raceResult.tote_tricast}</p>}
          {raceResult.tote_trifecta && <p><span className="font-medium">Trifecta:</span> {raceResult.tote_trifecta}</p>}
        </div>
      )}
    </Card>
  );
};