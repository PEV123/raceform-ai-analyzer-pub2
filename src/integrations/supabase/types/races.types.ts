export interface RacesTable {
  Row: {
    id: string
    off_time: string
    course: string
    race_name: string
    region: string
    race_class: string
    age_band: string
    rating_band: string
    prize: string
    field_size: number
    created_at: string | null
    race_id: string | null
    course_id: string | null
    distance_round: string | null
    distance: string | null
    distance_f: string | null
    pattern: string | null
    type: string | null
    going_detailed: string | null
    rail_movements: string | null
    stalls: string | null
    weather: string | null
    going: string | null
    surface: string | null
    jumps: string | null
    big_race: boolean | null
    is_abandoned: boolean | null
  }
  Insert: {
    id?: string
    off_time: string
    course: string
    race_name: string
    region: string
    race_class: string
    age_band: string
    rating_band: string
    prize: string
    field_size: number
    created_at?: string | null
    race_id?: string | null
    course_id?: string | null
    distance_round?: string | null
    distance?: string | null
    distance_f?: string | null
    pattern?: string | null
    type?: string | null
    going_detailed?: string | null
    rail_movements?: string | null
    stalls?: string | null
    weather?: string | null
    going?: string | null
    surface?: string | null
    jumps?: string | null
    big_race?: boolean | null
    is_abandoned?: boolean | null
  }
  Update: {
    id?: string
    off_time?: string
    course?: string
    race_name?: string
    region?: string
    race_class?: string
    age_band?: string
    rating_band?: string
    prize?: string
    field_size?: number
    created_at?: string | null
    race_id?: string | null
    course_id?: string | null
    distance_round?: string | null
    distance?: string | null
    distance_f?: string | null
    pattern?: string | null
    type?: string | null
    going_detailed?: string | null
    rail_movements?: string | null
    stalls?: string | null
    weather?: string | null
    going?: string | null
    surface?: string | null
    jumps?: string | null
    big_race?: boolean | null
    is_abandoned?: boolean | null
  }
  Relationships: []
}