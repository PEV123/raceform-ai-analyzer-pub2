const RACING_API_BASE_URL = "https://the-racing-api1.p.rapidapi.com/v1";
const RACING_API_KEY = "ac74dad816msh3e7378a264cc01dp1aee4ejsn58139d3bf46b";
const RACING_API_HOST = "the-racing-api1.p.rapidapi.com";

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
  silk_url: string | null;
  sire: string;
  sire_region: string;
  dam: string;
  dam_region: string;
  form: string | null;
  lbs: number;
  headgear: string | null;
  ofr: string | null;
  ts: string | null;
  jockey: string;
  trainer: string;
}

export const fetchTodaysRaces = async (): Promise<RacingApiRace[]> => {
  console.log("Fetching today's races from Racing API...");
  
  const response = await fetch(
    `${RACING_API_BASE_URL}/racecards?day=today&region_codes=%5B%22gb%22%2C%22ire%22%5D`,
    {
      headers: {
        "X-RapidAPI-Key": RACING_API_KEY,
        "X-RapidAPI-Host": RACING_API_HOST,
      },
    }
  );

  if (!response.ok) {
    console.error("Error fetching races:", response.statusText);
    throw new Error(`Failed to fetch races: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Received races data:", data);
  return data;
};