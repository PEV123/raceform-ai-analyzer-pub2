export const PACE_THRESHOLDS = {
  FAST_PACE: 11,    // 11 s/f = 100 points
  SLOW_PACE: 20,    // 20 s/f = 10 points
  VERY_SLOW_PACE: 25 // 25+ s/f = 0 points
} as const;

export const calculateSpeedRating = (avgAdjustedPace: number): number => {
  if (!avgAdjustedPace || avgAdjustedPace <= 0) return 0;
  
  const { FAST_PACE, SLOW_PACE, VERY_SLOW_PACE } = PACE_THRESHOLDS;
  
  if (avgAdjustedPace >= VERY_SLOW_PACE) {
    return 0;
  }
  
  if (avgAdjustedPace <= FAST_PACE) {
    return 100;
  }
  
  if (avgAdjustedPace >= SLOW_PACE) {
    // Linear interpolation between 10 and 0 points for very slow times
    // Keep more decimal places for finer granularity
    const ratio = (VERY_SLOW_PACE - avgAdjustedPace) / (VERY_SLOW_PACE - SLOW_PACE);
    return Number((10 * ratio).toFixed(4));
  }
  
  // Linear interpolation between 100 and 10 points for normal range
  // Keep more decimal places for finer granularity
  const ratio = (SLOW_PACE - avgAdjustedPace) / (SLOW_PACE - FAST_PACE);
  return Number((10 + (ratio * 90)).toFixed(4));
};

export const calculateAdjustedPace = (
  times: any[],
  distanceInFurlongs: number,
  distanceFactor: number
): { avgAdjustedPace: number; validTimeCount: number } => {
  let totalAdjustedPace = 0;
  let validTimeCount = 0;

  times?.forEach(time => {
    if (time.time && time.time !== '-') {
      const [mins, secs] = time.time.split(':').map(Number);
      const totalSeconds = mins * 60 + secs;
      const secondsPerFurlong = totalSeconds / distanceInFurlongs;
      
      // Adjust s/f by distance factor
      const adjustedPace = secondsPerFurlong / distanceFactor;
      
      if (adjustedPace > 0) {
        totalAdjustedPace += adjustedPace;
        validTimeCount++;
      }
    }
  });

  const avgAdjustedPace = validTimeCount > 0 ? 
    totalAdjustedPace / validTimeCount : 0;

  return { avgAdjustedPace, validTimeCount };
};