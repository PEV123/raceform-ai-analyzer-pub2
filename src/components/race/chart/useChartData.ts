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

const convertDistanceToFurlongs = (distance: string): number => {
  const miles = distance.match(/(\d+)m/)?.[1] ? Number(distance.match(/(\d+)m/)[1]) : 0;
  const furlongs = distance.match(/(\d+)f/)?.[1] ? Number(distance.match(/(\d+)f/)[1]) : 0;
  const halfFurlong = distance.includes('½') ? 0.5 : 0;
  return (miles * 8) + furlongs + halfFurlong;
};

const getDistanceFactor = (furlongs: number): number => {
  const BASE_DISTANCE = 12; // 1.5 miles
  const FACTOR_PER_FURLONG = 0.01;
  
  if (furlongs <= BASE_DISTANCE) return 1.0;
  return 1.0 + ((furlongs - BASE_DISTANCE) * FACTOR_PER_FURLONG);
};

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
      
      // Calculate adjusted speed rating based on distance and pace
      let totalAdjustedPace = 0;
      let validTimeCount = 0;

      console.log(`Processing horse: ${analysis.horse}`);

      details.forEach(detail => {
        const distanceInFurlongs = convertDistanceToFurlongs(detail.dist);
        const distanceFactor = getDistanceFactor(distanceInFurlongs);
        
        console.log(`Processing detail for distance: ${detail.dist} (${distanceInFurlongs}f, factor: ${distanceFactor})`);
        
        detail.horse_distance_times?.forEach(time => {
          console.log(`Processing time: ${time.time}`);
          if (time.time && time.time !== '-') {
            const [mins, secs] = time.time.split(':').map(Number);
            const totalSeconds = mins * 60 + secs;
            const secondsPerFurlong = totalSeconds / distanceInFurlongs;
            
            // Adjust s/f by distance factor
            const adjustedPace = secondsPerFurlong / distanceFactor;
            
            console.log(`Raw s/f: ${secondsPerFurlong}, Adjusted s/f: ${adjustedPace}`);
            
            if (adjustedPace > 0) {
              totalAdjustedPace += adjustedPace;
              validTimeCount++;
            }
          }
        });
      });

      const avgAdjustedPace = validTimeCount > 0 ? 
        totalAdjustedPace / validTimeCount : 0;

      console.log(`Final adjusted average pace: ${avgAdjustedPace}`);

      // Convert adjusted pace to speed rating (0-100 scale)
      let speedRating = 0;
      if (avgAdjustedPace > 0) {
        const BEST_PACE = 11;  // 11 s/f = 100 points
        const WORST_PACE = 16; // 16 s/f = 0 points
        const PACE_RANGE = WORST_PACE - BEST_PACE;
        
        if (avgAdjustedPace <= BEST_PACE) {
          speedRating = 100;
        } else if (avgAdjustedPace >= WORST_PACE) {
          speedRating = 0;
        } else {
          // Linear interpolation between 0 and 100
          speedRating = Math.round(
            ((WORST_PACE - avgAdjustedPace) / PACE_RANGE) * 100
          );
        }
      }

      console.log(`Calculated speed rating: ${speedRating}`);

      // Calculate overall score (0-100 scale)
      const overall = (
        (avgWinRate * 0.4) + // 40% weight to win rate
        (avgPlaceRate * 0.4) + // 40% weight to place rate
        (speedRating * 0.2) // 20% weight to speed rating
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
        actualPace: avgAdjustedPace.toFixed(2),
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