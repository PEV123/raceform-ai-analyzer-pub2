import { formatInTimeZone } from 'date-fns-tz';

export const generateRaceTitle = (
  race: { 
    off_time: string; 
    course: string; 
    race_name: string; 
  }, 
  template: string,
  siteName: string,
  timezone: string = 'Europe/London'
) => {
  const date = formatInTimeZone(new Date(race.off_time), timezone, 'MMMM do, yyyy');
  const time = formatInTimeZone(new Date(race.off_time), timezone, 'HH:mm');

  return template
    .replace('[date]', date)
    .replace('[venue]', race.course)
    .replace('[time]', time)
    .replace('[racename]', race.race_name)
    .replace('[sitename]', siteName);
};