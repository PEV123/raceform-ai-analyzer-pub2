export interface RacingApiRace {
  off_time: string;
  course: string;
  race_name: string;
  region: string;
  race_class: string;
  age_band: string;
  rating_band: string;
  prize: string;
  field_size: number;
  runners: RacingApiRunner[];
}

export interface RacingApiRunner {
  horse_id: string;
  number: number;
  draw: number;
  horse: string;
  silk_url?: string;
  sire: string;
  sire_region: string;
  dam: string;
  dam_region: string;
  form?: string;
  lbs: number;
  headgear?: string;
  ofr?: string;
  ts?: string;
  jockey: string;
  trainer: string;
}

export const fetchTodaysRaces = async (): Promise<RacingApiRace[]> => {
  console.log("Fetching today's races from Edge Function...");
  
  const response = await fetch(
    "https://vlcrqrmqghskrdhhsgqt.supabase.co/functions/v1/fetch-races",
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    console.error("Error fetching races:", response.statusText);
    const errorBody = await response.text();
    console.error("Error body:", errorBody);
    throw new Error(`Failed to fetch races: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Received races data:", data);

  // Transform the API response to match our expected format
  return data.racecards.map((racecard: any) => ({
    off_time: racecard.off_dt,
    course: racecard.course,
    race_name: racecard.race_name,
    region: racecard.region,
    race_class: racecard.race_class,
    age_band: racecard.age_band,
    rating_band: racecard.rating_band,
    prize: racecard.prize,
    field_size: parseInt(racecard.field_size),
    runners: racecard.runners.map((runner: any) => ({
      horse_id: runner.horse_id,
      number: parseInt(runner.number),
      draw: parseInt(runner.draw || '0'),
      horse: runner.horse,
      silk_url: runner.silk_url,
      sire: runner.sire,
      sire_region: runner.sire_region || '',
      dam: runner.dam,
      dam_region: runner.dam_region || '',
      form: runner.form,
      lbs: parseInt(runner.lbs),
      headgear: runner.headgear,
      ofr: runner.ofr,
      ts: runner.ts,
      jockey: runner.jockey,
      trainer: runner.trainer,
    })),
  }));
};