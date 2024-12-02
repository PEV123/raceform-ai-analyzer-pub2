export const convertDistanceToFurlongs = (distance: string): number => {
  const miles = distance.match(/(\d+)m/)?.[1] ? Number(distance.match(/(\d+)m/)[1]) : 0;
  const furlongs = distance.match(/(\d+)f/)?.[1] ? Number(distance.match(/(\d+)f/)[1]) : 0;
  const halfFurlong = distance.includes('½') ? 0.5 : 0;
  return (miles * 8) + furlongs + halfFurlong;
};

export const getDistanceFactor = (furlongs: number): number => {
  const BASE_DISTANCE = 12; // 1.5 miles
  const FACTOR_PER_FURLONG = 0.01;
  
  if (furlongs <= BASE_DISTANCE) return 1.0;
  return 1.0 + ((furlongs - BASE_DISTANCE) * FACTOR_PER_FURLONG);
};