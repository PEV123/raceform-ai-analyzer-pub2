export interface RunnersTable {
  Row: {
    id: string
    race_id: string | null
    horse_id: string
    number: number
    draw: number
    horse: string
    silk_url: string | null
    sire: string
    sire_region: string
    dam: string
    dam_region: string
    form: string | null
    lbs: number
    headgear: string | null
    ofr: string | null
    ts: string | null
    jockey: string
    trainer: string
    created_at: string | null
    dob: string | null
    age: string | null
    sex: string | null
    sex_code: string | null
    colour: string | null
    region: string | null
    breeder: string | null
    dam_id: string | null
    damsire: string | null
    damsire_id: string | null
    damsire_region: string | null
    trainer_id: string | null
    trainer_location: string | null
    trainer_14_days: Json | null
    owner: string | null
    owner_id: string | null
    prev_trainers: Json | null
    prev_owners: Json | null
    comment: string | null
    spotlight: string | null
    quotes: Json | null
    stable_tour: Json | null
    medical: Json | null
    headgear_run: string | null
    wind_surgery: string | null
    wind_surgery_run: string | null
    past_results_flags: Json | null
    rpr: string | null
    jockey_id: string | null
    last_run: string | null
    trainer_rtf: string | null
    odds: Json | null
  }
  Insert: {
    id?: string
    race_id?: string | null
    horse_id: string
    number: number
    draw: number
    horse: string
    silk_url?: string | null
    sire: string
    sire_region: string
    dam: string
    dam_region: string
    form?: string | null
    lbs: number
    headgear?: string | null
    ofr?: string | null
    ts?: string | null
    jockey: string
    trainer: string
    created_at?: string | null
    dob?: string | null
    age?: string | null
    sex?: string | null
    sex_code?: string | null
    colour?: string | null
    region?: string | null
    breeder?: string | null
    dam_id?: string | null
    damsire?: string | null
    damsire_id?: string | null
    damsire_region?: string | null
    trainer_id?: string | null
    trainer_location?: string | null
    trainer_14_days?: Json | null
    owner?: string | null
    owner_id?: string | null
    prev_trainers?: Json | null
    prev_owners?: Json | null
    comment?: string | null
    spotlight?: string | null
    quotes?: Json | null
    stable_tour?: Json | null
    medical?: Json | null
    headgear_run?: string | null
    wind_surgery?: string | null
    wind_surgery_run?: string | null
    past_results_flags?: Json | null
    rpr?: string | null
    jockey_id?: string | null
    last_run?: string | null
    trainer_rtf?: string | null
    odds?: Json | null
  }
  Update: {
    id?: string
    race_id?: string | null
    horse_id?: string
    number?: number
    draw?: number
    horse?: string
    silk_url?: string | null
    sire?: string
    sire_region?: string
    dam?: string
    dam_region?: string
    form?: string | null
    lbs?: number
    headgear?: string | null
    ofr?: string | null
    ts?: string | null
    jockey?: string
    trainer?: string
    created_at?: string | null
    dob?: string | null
    age?: string | null
    sex?: string | null
    sex_code?: string | null
    colour?: string | null
    region?: string | null
    breeder?: string | null
    dam_id?: string | null
    damsire?: string | null
    damsire_id?: string | null
    damsire_region?: string | null
    trainer_id?: string | null
    trainer_location?: string | null
    trainer_14_days?: Json | null
    owner?: string | null
    owner_id?: string | null
    prev_trainers?: Json | null
    prev_owners?: Json | null
    comment?: string | null
    spotlight?: string | null
    quotes?: Json | null
    stable_tour?: Json | null
    medical?: Json | null
    headgear_run?: string | null
    wind_surgery?: string | null
    wind_surgery_run?: string | null
    past_results_flags?: Json | null
    rpr?: string | null
    jockey_id?: string | null
    last_run?: string | null
    trainer_rtf?: string | null
    odds?: Json | null
  }
  Relationships: [
    {
      foreignKeyName: "runners_race_id_fkey"
      columns: ["race_id"]
      isOneToOne: false
      referencedRelation: "races"
      referencedColumns: ["id"]
    }
  ]
}