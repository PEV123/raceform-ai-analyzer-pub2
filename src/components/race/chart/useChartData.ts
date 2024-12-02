import { useMemo } from "react";
import { calculateRates } from "./rateCalculations";
import { calculateSpeedMetrics, calculateSpeedRating } from "./speedCalculations";
import { Tables } from "@/integrations/supabase/types";
import { ChartData, SortOption } from "./types";

export const useChartData = (
  analyses: (Tables<"horse_distance_analysis"> & {
    horse_distance_details: (Tables<"horse_distance_details"> & {
      horse_distance_times: Tables<"horse_distance_times">[];
    })[];
  })[],
  sortBy: SortOption
) => {
  return useMemo(() => {
    if (!analyses?.length) return [];

    console.log('Processing analyses:', analyses.length, 'total analyses');

    // Use a Map to ensure unique entries by horse_id
    const uniqueHorsesMap = new Map<string, ChartData>();

    analyses.forEach(analysis => {
      // Skip if we've already processed this horse
      if (uniqueHorsesMap.has(analysis.horse_id)) {
        console.log(`Skipping duplicate horse: ${analysis.horse} (${analysis.horse_id})`);
        return;
      }

      console.log(`Processing horse ${analysis.horse} (${analysis.horse_id})`);
      
      const details = analysis.horse_distance_details || [];
      
      // Calculate average rates across all distances
      const rateMetrics = details.map(detail => calculateRates(detail));
      const avgWinRate = rateMetrics.reduce((acc, curr) => acc + curr.winRate, 0) / (details.length || 1);
      const avgPlaceRate = rateMetrics.reduce((acc, curr) => acc + curr.placeRate, 0) / (details.length || 1);

      // Calculate best speed rating across all distances
      let bestSpeedRating = 0;
      let finalAdjustedPace = 0;

      details.forEach(detail => {
        const { avgSecondsPerFurlong, validTimeCount } = calculateSpeedMetrics(
          detail.horse_distance_times,
          detail.dist
        );

        if (validTimeCount > 0) {
          const currentSpeedRating = calculateSpeedRating(avgSecondsPerFurlong);
          if (currentSpeedRating > bestSpeedRating) {
            bestSpeedRating = currentSpeedRating;
            finalAdjustedPace = avgSecondsPerFurlong;
          }
        }
      });

      console.log(`${analysis.horse}: Final speed rating: ${bestSpeedRating}, adjusted pace: ${finalAdjustedPace}`);

      // Calculate overall score (0-100 scale)
      const overall = (
        (avgWinRate * 0.4) + // 40% weight to win rate
        (avgPlaceRate * 0.4) + // 40% weight to place rate
        (bestSpeedRating * 0.2) // 20% weight to speed rating
      );

      uniqueHorsesMap.set(analysis.horse_id, {
        horse: analysis.horse.length > 12 
          ? analysis.horse.substring(0, 12) + '...'
          : analysis.horse,
        fullName: analysis.horse,
        horse_id: analysis.horse_id,
        avgWinRate,
        avgPlaceRate,
        speedRating: bestSpeedRating,
        overall,
        actualPace: finalAdjustedPace.toFixed(2),
        totalRuns: analysis.total_runs || 0
      });
    });

    const data = Array.from(uniqueHorsesMap.values());

    // Sort data based on selected option
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case "win":
          return b.avgWinRate - a.avgWinRate;
        case "place":
          return b.avgPlaceRate - a.avgPlaceRate;
        case "speed":
          return b.speedRating - a.speedRating;
        case "overall":
          return b.overall - a.overall;
        default:
          return 0; // number order is handled by the parent component
      }
    });
  }, [analyses, sortBy]);
};