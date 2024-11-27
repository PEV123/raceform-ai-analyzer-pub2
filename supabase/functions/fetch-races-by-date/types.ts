export interface Runner {
  horse_id: string;
  horse: string;
  number: string | number;
  draw: string | number;
  silk_url?: string;
  sire: string;
  sire_region: string;
  dam: string;
  dam_region: string;
  form?: string;
  lbs: string | number;
  headgear?: string;
  ofr?: string;
  ts?: string;
  jockey: string;
  trainer: string;
  dob?: string;
  age?: string;
  sex?: string;
  sex_code?: string;
  colour?: string;
  region?: string;
  breeder?: string;
  dam_id?: string;
  damsire?: string;
  damsire_id?: string;
  damsire_region?: string;
  trainer_id?: string;
  trainer_location?: string;
  trainer_14_days?: any;
  owner?: string;
  owner_id?: string;
  prev_trainers?: any[];
  prev_owners?: any[];
  comment?: string;
  spotlight?: string;
  quotes?: any[];
  stable_tour?: any[];
  medical?: any[];
  headgear_run?: string;
  wind_surgery?: string;
  wind_surgery_run?: string;
  past_results_flags?: any[];
  rpr?: string;
  jockey_id?: string;
  last_run?: string;
  trainer_rtf?: string;
  odds?: any[];
}

export interface Race {
  off_time: string;
  course: string;
  race_name: string;
  region: string;
  race_class: string;
  age_band: string;
  rating_band: string;
  prize: string;
  field_size: string | number;
  race_id?: string;
  course_id?: string;
  distance_round?: string;
  distance?: string;
  distance_f?: string;
  pattern?: string;
  type?: string;
  going_detailed?: string;
  rail_movements?: string;
  stalls?: string;
  weather?: string;
  going?: string;
  surface?: string;
  jumps?: string;
  big_race?: boolean;
  is_abandoned?: boolean;
  runners?: Runner[];
}

export interface ApiResponse {
  races: Race[];
}