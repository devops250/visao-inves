export interface Call {
  id: string;
  customerPhone: string;
  customerName: string | null;
  startedAt: string;
  endedAt: string | null;
  duration: number;
  status: 'completed' | 'voicemail' | 'no-answer' | 'failed' | 'in-progress';
  recordingUrl: string | null;
  transcript: string | null;
  summary: string | null;
  analysis: Record<string, any> | null;
  source: 'vapi' | 'historical';
  cost: number | null;
}

export interface DashboardStats {
  total: number;
  completed: number;
  withAnalysis: number;
  voicemail: number;
  noAnswer: number;
  failed: number;
  periodStart: string;
  periodEnd: string;
  completionRate: number;
}

export type CallFilter = 'all' | 'completed' | 'with-analysis' | 'voicemail' | 'no-answer';

export interface HistoricalCall {
  id: string;
  customerPhone: string;
  customerName: string | null;
  date: string;
  startedAt?: string;
  audioUrl?: string;
  driveUrl?: string;
  duration: number | null;
  status: Call['status'];
}
