export interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface BasicSummaryResponse {
  total: number;
  statusCounts: StatusCount[];
}
