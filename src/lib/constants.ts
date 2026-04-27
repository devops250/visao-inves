import type { Call } from './types';

export const STATUS_LABELS: Record<Call['status'], string> = {
  completed: 'COMPLETADA',
  voicemail: 'CAIXA POSTAL',
  'no-answer': 'NÃO ATENDEU',
  failed: 'FALHA',
  'in-progress': 'EM ANDAMENTO',
};

export const STATUS_CLASSES: Record<Call['status'], string> = {
  completed: 'bg-teal-50 text-teal-800 border-teal-200',
  voicemail: 'bg-amber-50 text-amber-800 border-amber-200',
  'no-answer': 'bg-red-50 text-red-800 border-red-200',
  failed: 'bg-gray-100 text-gray-700 border-gray-200',
  'in-progress': 'bg-navy-50 text-navy-800 border-navy-200',
};

export const POLLING_INTERVAL_MS = 30_000;
