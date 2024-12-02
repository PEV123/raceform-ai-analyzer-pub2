// Calculate win and place rates
export const calculateRates = (detail: any) => {
  const winRate = Number(detail.win_percentage || 0) * 100;
  const placeRate = ((detail.wins + detail.second_places + detail.third_places) / detail.runs) * 100;
  
  return { winRate, placeRate };
};