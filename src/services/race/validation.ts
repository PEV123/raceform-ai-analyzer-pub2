export const validateRaceData = (race: any) => {
  if (!race) {
    console.error('No race data provided');
    throw new Error('No race data provided');
  }

  if (!race.course) {
    console.error('Race is missing course:', race);
    throw new Error('Race is missing required field: course');
  }

  console.log('Race data validated:', {
    course: race.course,
    time: race.off_time,
    runners: race.runners?.length || 0
  });
};

export const validateRunnerData = (runner: any) => {
  const requiredFields = ['horse_id', 'horse', 'sire', 'sire_region', 'dam', 'dam_region', 'trainer'];
  const missingFields = requiredFields.filter(field => !runner[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Runner ${runner.horse || 'unknown'} missing required fields:`, missingFields);
    return false;
  }
  
  return true;
};