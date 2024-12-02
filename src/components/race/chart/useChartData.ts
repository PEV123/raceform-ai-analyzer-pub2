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
      
      // Calculate win rate (0-100%)
      const avgWinRate = details.reduce((acc, detail) => 
        acc + (Number(detail.win_percentage) || 0), 0) / (details.length || 1) * 100;
      
      // Calculate place rate (0-100%)
      const avgPlaceRate = details.reduce((acc, detail) => {
        const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;
        return acc + (placeRate || 0);
      }, 0) / (details.length || 1);
      
      // Calculate speed rating based on average seconds per furlong
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

      // Convert pace to a speed rating (0-50 scale)
      // Assuming average pace is around 12-13 seconds per furlong
      // Faster times (lower seconds) should result in higher ratings
      const speedRating = avgSecondsPerFurlong > 0 
        ? Math.max(0, Math.min(50, ((14 - avgSecondsPerFurlong) * 10) + 25))
        : 0;

      // Calculate overall score (0-50 scale)
      const overall = (
        ((avgWinRate / 2) * 0.4) + // 40% weight to win rate (scaled to 0-50)
        ((avgPlaceRate / 2) * 0.4) + // 40% weight to place rate (scaled to 0-50)
        (speedRating * 0.2) // 20% weight to speed rating (already 0-50)
      );

      return {
        horse: analysis.horse.length > 12 
          ? analysis.horse.substring(0, 12) + '...'
          : analysis.horse,
        fullName: analysis.horse,
        avgWinRate,
        avgPlaceRate,
        speedRating,
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