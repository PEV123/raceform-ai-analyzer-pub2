export interface RacingApiRace {
  race_id: string;
  course: string;
  course_id: string;
  date: string;
  off_time: string;
  off_dt: string;
  race_name: string;
  distance_round: string;
  distance: string;
  distance_f: string;
  region: string;
  pattern: string;
  race_class: string;
  type: string;
  age_band: string;
  rating_band: string;
  prize: string;
  field_size: string;
  going_detailed: string;
  rail_movements: string;
  stalls: string;
  weather: string;
  going: string;
  surface: string;
  jumps: string;
  big_race: boolean;
  is_abandoned: boolean;
  runners: RacingApiRunner[];
}

export interface RacingApiRunner {
  horse_id: string;
  horse: string;
  dob: string;
  age: string;
  sex: string;
  sex_code: string;
  colour: string;
  region: string;
  breeder: string;
  dam: string;
  dam_id: string;
  dam_region: string;
  sire: string;
  sire_id: string;
  sire_region: string;
  damsire: string;
  damsire_id: string;
  damsire_region: string;
  trainer: string;
  trainer_id: string;
  trainer_location: string;
  trainer_14_days: Record<string, any>;
  owner: string;
  owner_id: string;
  prev_trainers: any[];
  prev_owners: any[];
  comment: string;
  spotlight: string;
  quotes: string[];
  stable_tour: string[];
  medical: string[];
  number: string;
  draw: string;
  headgear: string;
  headgear_run: string;
  wind_surgery: string;
  wind_surgery_run: string;
  past_results_flags: string[];
  lbs: string;
  ofr: string;
  rpr: string;
  ts: string;
  jockey: string;
  jockey_id: string;
  silk_url: string;
  last_run: string;
  form: string;
  trainer_rtf: string;
  odds: any[];
}

export const fetchTodaysRaces = async (): Promise<RacingApiRace[]> => {
  console.log("Fetching today's races from Edge Function...");
  
  const response = await fetch(
    "https://vlcrqrmqghskrdhhsgqt.supabase.co/functions/v1/fetch-races",
    {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsY3Jxcm1xZ2hza3JkaGhzZ3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2ODU2NTcsImV4cCI6MjA0ODI2MTY1N30.DDpFswiG9PgZqeQZIA5KSS_k8sIzRKg4A3Wj-n7xkIU`,
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
  
  // Detailed logging of received data structure
  console.log("Full API Response:", JSON.stringify(data, null, 2));
  
  // Check for missing fields in races
  data.racecards.forEach((race: any, index: number) => {
    const missingFields = Object.keys(race).filter(key => race[key] === undefined);
    if (missingFields.length > 0) {
      console.warn(`Race ${index} is missing fields:`, missingFields);
    }
    
    // Check runners data
    race.runners?.forEach((runner: any, runnerIndex: number) => {
      const missingRunnerFields = Object.keys(runner).filter(key => runner[key] === undefined);
      if (missingRunnerFields.length > 0) {
        console.warn(`Runner ${runnerIndex} in race ${index} is missing fields:`, missingRunnerFields);
      }
    });
  });

  return data.racecards.map((racecard: any) => ({
    ...racecard,
    field_size: parseInt(racecard.field_size),
    runners: racecard.runners.map((runner: any) => ({
      ...runner,
      number: parseInt(runner.number || '0'),
      draw: parseInt(runner.draw || '0'),
      lbs: parseInt(runner.lbs || '0'),
    }))
  }));
};