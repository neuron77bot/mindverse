import { useMindverseStore } from '../../store/mindverseStore';
import type { LayoutDirection } from '../../utils/layoutUtils';

const layouts: { key: LayoutDirection; label: string; icon: string; title: string }[] = [
  { key: 'LR', label: 'LR', icon: '→', title: 'Left to Right' },
  { key: 'TB', label: 'TB', icon: '↓', title: 'Top to Bottom' },
  { key: 'RL', label: 'RL', icon: '←', title: 'Right to Left' },
  { key: 'BT', label: 'BT', icon: '↑', title: 'Bottom to Top' },
];

export default function LayoutFilter() {
  const layoutDirection = useMindverseStore((s) => s.layoutDirection);
  const setLayoutDirection = useMindverseStore((s) => s.setLayoutDirection);

  return (
    <div className="bg-slate-800 rounded-xl p-2 sm:p-3 shadow-lg border border-slate-700">
      <h3 className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
        Layout
      </h3>
      <div className="flex gap-1.5">
        {layouts.map(({ key, label, icon, title }) => (
          <button
            key={key}
            onClick={() => setLayoutDirection(key)}
            title={title}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
              layoutDirection === key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
