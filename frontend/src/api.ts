const API_BASE = '';

export interface SummaryData {
  quarterlyTarget: number;
  quarterlyRevenue: number;
  percentage: number;
}

export interface DriverMetric {
  value: number;
  change: number;
}

export interface DriversData {
  winRate: DriverMetric;
  avgDealSize: DriverMetric;
  avgSalesCycle: DriverMetric;
  pipelineValue: DriverMetric;
}

export interface RiskFactor {
  type: string;
  text: string;
  data: any;
}

export interface Recommendation {
  id: string;
  text: string;
  data?: any;
}

export interface TrendDataPoint {
  month: string;
  revenue: number;
}

export const fetchSummary = async (quarter: string, year: string): Promise<SummaryData> => {
  const res = await fetch(`${API_BASE}/summary?quarter=${quarter}&year=${year}`);
  const json = await res.json();
  return json.data;
};

export const fetchDrivers = async (quarter: string, year: string): Promise<DriversData> => {
  const res = await fetch(`${API_BASE}/drivers?quarter=${quarter}&year=${year}`);
  const json = await res.json();
  return json.data;
};

export const fetchRiskFactors = async (): Promise<RiskFactor[]> => {
  const res = await fetch(`${API_BASE}/risk-factors`);
  const json = await res.json();
  return json.data;
};

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  const res = await fetch(`${API_BASE}/recommendations`);
  const json = await res.json();
  return json.data;
};

export const fetchTrend = async (): Promise<TrendDataPoint[]> => {
  const res = await fetch(`${API_BASE}/summary/trend`);
  const json = await res.json();
  return json.data;
};
