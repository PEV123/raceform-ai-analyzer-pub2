export interface ImportStats {
  totalRaces: number;
  successfulRaces: number;
  failedRaces: number;
  horseResults: {
    attempted: number;
    successful: number;
    failed: number;
  };
  distanceAnalysis: {
    attempted: number;
    successful: number;
    failed: number;
  };
}

export interface ImportJob {
  id: string;
  date: string;
  status: 'processing' | 'completed' | 'incomplete' | 'failed';
  progress: number;
  error?: string;
  summary?: ImportStats;
}