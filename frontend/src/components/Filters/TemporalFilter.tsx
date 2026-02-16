import { useMindverseStore } from '../../store/mindverseStore';
import type { TemporalState } from '../../types';
import { TEMPORAL_LABELS } from '../../data/mockData';

const temporalOptions: (TemporalState | 'ALL')[] = ['ALL', 'PAST', 'PRESENT', 'FUTURE'];

const temporalIcons: Record<string, string> = {
  ALL: '🔄',
  PAST: '⏮️',
  PRESENT: '⏺️',
  FUTURE: '⏭️',
};

export default function TemporalFilter() {
  const activeTemporalFilter = useMindverseStore(
    (state) => state.activeTemporalFilter
  );
  const setTemporalFilter = useMindverseStore((state) => state.setTemporalFilter);

  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 shadow-lg border border-slate-700">
      {temporalOptions.map((option) => (
        <button
          key={option}
          onClick={() => setTemporalFilter(option)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTemporalFilter === option
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <span>{temporalIcons[option]}</span>
          <span>{TEMPORAL_LABELS[option]}</span>
        </button>
      ))}
    </div>
  );
}
