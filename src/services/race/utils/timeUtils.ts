export const extractRaceTime = (offTime: string | undefined): string => {
  const timeMatch = offTime?.match(/(\d{2}:\d{2})/);
  return timeMatch ? timeMatch[1] : '00:00';
};

export const constructRaceDateTime = (date: string, time: string): string => {
  return `${date}T${time}:00.000Z`;
};