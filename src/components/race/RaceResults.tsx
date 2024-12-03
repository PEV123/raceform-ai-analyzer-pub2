import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface RaceResultsProps {
  raceResult: Tables<"race_results"> & {
    runner_results: Tables<"runner_results">[];
  };
}

export const RaceResults = ({ raceResult }: RaceResultsProps) => {
  if (!raceResult) return null;

  const sortedRunners = raceResult.runner_results?.sort((a, b) => {
    // Convert positions to numbers, handling non-runners (PU, etc)
    const posA = parseInt(a.position) || 999;
    const posB = parseInt(b.position) || 999;
    return posA - posB;
  });

  // Calculate maximum beaten distance for scaling
  const maxBeatenDistance = Math.max(...sortedRunners.map(runner => {
    const btn = parseFloat(runner.btn || "0");
    return isNaN(btn) ? 0 : btn;
  }));

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
      <div className="relative h-40 mb-8 overflow-hidden">
        {sortedRunners?.map((runner, index) => {
          const position = parseInt(runner.position);
          if (isNaN(position)) return null;
          
          const btn = parseFloat(runner.btn || "0");
          const distanceBehindLeader = isNaN(btn) ? 0 : btn;
          const scaledDistance = (distanceBehindLeader / (maxBeatenDistance || 1)) * 60;
          
          return (
            <motion.div
              key={runner.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: scaledDistance, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              className="absolute flex items-center gap-2"
              style={{ top: `${index * 40}px` }}
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                {position}
              </div>
              <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 text-sm">
                <div className="font-medium">{runner.horse}</div>
                <div className="text-xs text-muted-foreground">
                  {distanceBehindLeader > 0 ? `${distanceBehindLeader}L behind` : 'Winner'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-3">
        {sortedRunners?.map((runner) => (
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
                  <div className="text-sm mt-1 text-muted-foreground">{runner.comment}</div>
                )}
              </div>
              <div className="text-sm text-right">
                {runner.btn && runner.btn !== '0' && (
                  <div className="font-medium text-secondary">{runner.btn}L</div>
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