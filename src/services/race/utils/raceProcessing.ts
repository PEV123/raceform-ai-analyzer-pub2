import { checkExistingRace, insertRace } from "./raceQueries";
import { extractRaceTime, constructRaceDateTime } from "./timeUtils";
import { prepareRaceData } from "./raceDataPreparation";
import { processRunner } from "./runnerProcessing";

export const processRace = async (race: any) => {
  console.log(`Processing race at ${race.course}`);
  console.log('Raw race data:', JSON.stringify(race, null, 2));
  
  try {
    // Check if race exists
    const existingRace = await checkExistingRace(race.race_id);
    if (existingRace) {
      console.log(`Race ${race.race_id} already exists, returning existing race`);
      return existingRace;
    }

    // Extract and construct race time
    const raceTime = extractRaceTime(race.off_time);
    console.log('Extracted race time:', raceTime);

    const raceDateTime = constructRaceDateTime(race.date, raceTime);
    console.log('Using race datetime:', raceDateTime);

    // Prepare and insert race data
    const raceData = prepareRaceData(race, raceDateTime);
    return await insertRace(raceData);

  } catch (error) {
    console.error(`Error in processRace:`, error);
    throw error;
  }
};

export { processRunner };