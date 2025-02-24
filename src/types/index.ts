export interface ScoreLevel {
  level: number;
  score: number | string;
}

export interface ScoreMatrix {
  benchmark: number;
  interval: number;
  levels: ScoreLevel[];
}
