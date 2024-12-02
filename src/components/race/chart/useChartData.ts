import { useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";

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

    const data: ChartData[] = analyses.map(analysis => {
      const details = analysis.horse_distance_details || [];
      
      const avgWinRate = details.reduce((acc, detail) => 
        acc + (Number(detail.win_percentage) || 0), 0) / (details.length || 1) * 100;
      
      const avgPlaceRate = details.reduce((acc, detail) => {
        const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;
        return acc + (placeRate || 0);
      }, 0) / (details.length || 1);
      
      let totalSecondsPerFurlong = 0;
      let validTimeCount = 0;

      details.forEach(detail => {
        detail.horse_distance_times?.forEach(time => {
          if (time.time && time.time !== '-') {
            const [mins, secs] = time.time.split(':').map(Number);
            const seconds = mins * 60 + secs;
            const furlongs = detail.dist.match(/(\d+)f/)?.[1] 
              ? Number(detail.dist.match(/(\d+)f/)[1]) 
              : 0;
            if (seconds > 0 && furlongs > 0) {
              totalSecondsPerFurlong += seconds / furlongs;
              validTimeCount++;
            }
          }
        });
      });

      const avgSecondsPerFurlong = validTimeCount > 0 ? 
        totalSecondsPerFurlong / validTimeCount : 0;

      // Normalize speed rating to be between 0-100
      // Assuming typical range is between 10-15 seconds per furlong
      const normalizedSpeedRating = avgSecondsPerFurlong > 0 
        ? Math.max(0, Math.min(100, (15 - avgSecondsPerFurlong) * 20))
        : 0;

      // Calculate overall score as weighted average of all metrics
      const overall = (
        (avgWinRate * 0.4) + // 40% weight to win rate
        (avgPlaceRate * 0.3) + // 30% weight to place rate
        (normalizedSpeedRating * 0.3) // 30% weight to speed rating
      );

      return {
        horse: analysis.horse.length > 12 
          ? analysis.horse.substring(0, 12) + '...'
          : analysis.horse,
        fullName: analysis.horse,
        avgWinRate,
        avgPlaceRate,
        speedRating: normalizedSpeedRating,
        overall,
        actualPace: avgSecondsPerFurlong.toFixed(2),
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