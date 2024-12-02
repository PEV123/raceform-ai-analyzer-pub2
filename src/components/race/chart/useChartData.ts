import { useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import { convertDistanceToFurlongs, getDistanceFactor } from "./distanceCalculations";
import { calculateAdjustedPace, calculateSpeedRating } from "./paceCalculations";

type SortOption = "number" | "win" | "place" | "speed" | "overall";

interface ChartData {
  horse: string;
  fullName: string;
  avgWinRate: number;
  avgPlaceRate: number;
  speedRating: number;
  overall: number;
  actualPace: string;
  totalRuns: number;
}

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

    console.log('Processing analyses:', analyses);

    const data: ChartData[] = analyses.map(analysis => {
      const details = analysis.horse_distance_details || [];
      
      // Calculate win rate (0-100%)
      const avgWinRate = details.reduce((acc, detail) => 
        acc + (Number(detail.win_percentage) || 0), 0) / (details.length || 1) * 100;
      
      // Calculate place rate (0-100%)
      const avgPlaceRate = details.reduce((acc, detail) => {
        const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;
        return acc + (placeRate || 0);
      }, 0) / (details.length || 1);

      console.log(`Processing horse: ${analysis.horse}`);

      // Calculate adjusted speed rating based on distance and pace
      let bestSpeedRating = 0;
      let finalAdjustedPace = 0;

      details.forEach(detail => {
        const distanceInFurlongs = convertDistanceToFurlongs(detail.dist);
        const distanceFactor = getDistanceFactor(distanceInFurlongs);
        
        console.log(`Processing detail for distance: ${detail.dist} (${distanceInFurlongs}f, factor: ${distanceFactor})`);
        
        const { avgAdjustedPace, validTimeCount } = calculateAdjustedPace(
          detail.horse_distance_times,
          distanceInFurlongs,
          distanceFactor
        );

        if (validTimeCount > 0) {
          const currentSpeedRating = calculateSpeedRating(avgAdjustedPace);
          if (currentSpeedRating > bestSpeedRating) {
            bestSpeedRating = currentSpeedRating;
            finalAdjustedPace = avgAdjustedPace;
          }
        }
      });

      console.log(`Final speed rating: ${bestSpeedRating}, adjusted pace: ${finalAdjustedPace}`);

      // Calculate overall score (0-100 scale)
      const overall = (
        (avgWinRate * 0.4) + // 40% weight to win rate
        (avgPlaceRate * 0.4) + // 40% weight to place rate
        (bestSpeedRating * 0.2) // 20% weight to speed rating
      );

      return {
        horse: analysis.horse.length > 12 
          ? analysis.horse.substring(0, 12) + '...'
          : analysis.horse,
        fullName: analysis.horse,
        avgWinRate,
        avgPlaceRate,
        speedRating: bestSpeedRating,
        overall,
        actualPace: finalAdjustedPace.toFixed(2),
        totalRuns: analysis.total_runs || 0
      };
    });

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