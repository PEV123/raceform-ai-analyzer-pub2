export const convertTimeToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === '-') return 0;
  const [mins, secs] = timeStr.split(':').map(Number);
  return mins * 60 + secs;
};

export const convertDistanceToFurlongs = (dist: string): number => {
  const miles = dist.match(/(\d+)m/)?.[1] ? Number(dist.match(/(\d+)m/)[1]) : 0;
  const furlongs = dist.match(/(\d+)f/)?.[1] ? Number(dist.match(/(\d+)f/)[1]) : 0;
  const halfFurlong = dist.includes('½') ? 0.5 : 0;
  return (miles * 8) + furlongs + halfFurlong;
};

export const formatSecondsPerFurlong = (seconds: number): string => {
  if (!seconds || seconds === 0) return '-';
  return seconds.toFixed(2);
};

export const sortDistances = (a: any, b: any) => {
  const aFurlongs = convertDistanceToFurlongs(a.dist);
  const bFurlongs = convertDistanceToFurlongs(b.dist);
  return aFurlongs - bFurlongs;
};