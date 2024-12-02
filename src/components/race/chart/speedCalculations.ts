import { convertTimeToSeconds, convertDistanceToFurlongs } from "../horseDistanceUtils";

export const calculateSpeedMetrics = (times: any[], distance: string) => {
  let secondsPerFurlong = 0;
  let validTimeCount = 0;

  times?.forEach(time => {
    if (time.time && time.time !== '-') {
      const seconds = convertTimeToSeconds(time.time);
      const furlongs = convertDistanceToFurlongs(distance);
      if (seconds > 0 && furlongs > 0) {
        secondsPerFurlong += seconds / furlongs;
        validTimeCount++;
      }
    }
  });

  const avgSecondsPerFurlong = validTimeCount > 0 ? 
    secondsPerFurlong / validTimeCount : 0;

  return { avgSecondsPerFurlong, validTimeCount };
};

export const calculateSpeedRating = (avgSecondsPerFurlong: number) => {
  if (avgSecondsPerFurlong === 0) return 0;

  // Linear scale from 11-20 s/f (100-10 points)
  if (avgSecondsPerFurlong <= 20) {
    return Math.max(10, 100 - ((avgSecondsPerFurlong - 11) * (90/9)));
  }
  
  // Linear scale from 20-25 s/f (10-0 points)
  if (avgSecondsPerFurlong <= 25) {
    return Math.max(0, 10 - ((avgSecondsPerFurlong - 20) * 2));
  }

  return 0;
};