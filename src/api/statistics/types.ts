export interface PlatformStatisticsReady {
  totalCardsTracked: number;
  totalCollectors: number;
  totalPlatformValue: {
    usd: number;
    formattedUsd: string;
  };
  lastUpdated: string;
  nextUpdateAt: string;
}

export interface PlatformStatisticsCalculating {
  status: 'calculating';
  message: string;
  estimatedReadyAt: string;
}

export type PlatformStatisticsData = PlatformStatisticsReady | PlatformStatisticsCalculating;

export interface PlatformStatisticsResponse {
  success: boolean;
  data: PlatformStatisticsData | null;
  error: {
    message: string;
    code: string;
  } | null;
}