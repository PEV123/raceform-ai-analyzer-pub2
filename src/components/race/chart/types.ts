export interface ChartData {
  horse: string;
  fullName: string;
  horse_id: string;  // Added to ensure unique identification
  avgWinRate: number;
  avgPlaceRate: number;
  speedRating: number;
  overall: number;
  actualPace: string;
  totalRuns: number;
}

export type SortOption = "number" | "win" | "place" | "speed" | "overall";