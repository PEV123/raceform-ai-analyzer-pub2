import { processHorseResults } from "./processing/horseResults.ts";
import { processHorseDistanceAnalysis } from "./processing/distanceAnalysis.ts";
import { ImportStats, HorseData } from "./types.ts";

const BATCH_SIZE = 5; // Process 5 horses at a time

export async function processHorseBatch(
  supabase: any,
  horses: HorseData[],
  stats: ImportStats
): Promise<void> {
  console.log(`Processing batch of ${horses.length} horses`);

  const promises = horses.map(horse => processHorse(supabase, horse, stats));
  await Promise.all(promises);
}

async function processHorse(
  supabase: any,
  horse: HorseData,
  stats: ImportStats
): Promise<void> {
  console.log(`Processing horse: ${horse.horseName} (${horse.horseId})`);

  try {
    await processHorseResults(supabase, horse.horseId, stats);
    await processHorseDistanceAnalysis(supabase, horse.horseId, stats);
  } catch (error) {
    console.error(`Error processing horse ${horse.horseId}:`, error);
    stats.horseResults.failed++;
    stats.distanceAnalysis.failed++;
  }
}

export function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}