import type { Call } from '@/lib/types';
import { CallCard } from './CallCard';

interface Props {
  calls: Call[];
}

export function CallList({ calls }: Props) {
  if (calls.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-navy-100 p-10 text-center">
        <div className="text-navy-400 text-sm">
          Nenhuma ligação encontrada para este filtro.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <CallCard key={call.id} call={call} />
      ))}
    </div>
  );
}
