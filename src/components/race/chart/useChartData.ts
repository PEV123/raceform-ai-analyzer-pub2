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
      
      // Calculate speed rating based on average seconds per furlong
      let totalSecondsPerFurlong = 0;
      let validTimeCount = 0;

      console.log(`Processing horse: ${analysis.horse}`);

      details.forEach(detail => {
        console.log(`Processing detail for distance: ${detail.dist}`);
        detail.horse_distance_times?.forEach(time => {
          console.log(`Processing time: ${time.time}`);
          if (time.time && time.time !== '-') {
            const [mins, secs] = time.time.split(':').map(Number);
            const seconds = mins * 60 + secs;
            const furlongs = Number(detail.dist.match(/(\d+)f/)?.[1] || 0);
            
            console.log(`Calculated seconds: ${seconds}, furlongs: ${furlongs}`);
            
            if (seconds > 0 && furlongs > 0) {
              const spf = seconds / furlongs;
              console.log(`Seconds per furlong: ${spf}`);
              totalSecondsPerFurlong += spf;
              validTimeCount++;
            }
          }
        });
      });

      const avgSecondsPerFurlong = validTimeCount > 0 ? 
        totalSecondsPerFurlong / validTimeCount : 0;

      console.log(`Final avg seconds per furlong: ${avgSecondsPerFurlong}`);

      // Convert pace to a speed rating (0-50 scale)
      // New calculation that works with actual race times
      // Typical range for seconds per furlong is 11-15 seconds
      // We'll use this range to create a 0-50 scale
      let speedRating = 0;
      if (avgSecondsPerFurlong > 0) {
        // If time is faster than 11 seconds, cap at 50
        if (avgSecondsPerFurlong <= 11) {
          speedRating = 50;
        }
        // If time is slower than 15 seconds, minimum 5
        else if (avgSecondsPerFurlong >= 15) {
          speedRating = 5;
        }
        // Otherwise, scale between 5 and 50
        else {
          speedRating = 50 - ((avgSecondsPerFurlong - 11) * (45 / 4));
        }
      }

      console.log(`Calculated speed rating: ${speedRating}`);

      // Calculate overall score (0-50 scale)
      const overall = (
        ((avgWinRate / 2) * 0.4) + // 40% weight to win rate (scaled to 0-50)
        ((avgPlaceRate / 2) * 0.4) + // 40% weight to place rate (scaled to 0-50)
        (speedRating * 0.2) // 20% weight to speed rating (already 0-50)
      );

      const result = {
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

      console.log('Final data point:', result);
      return result;
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
