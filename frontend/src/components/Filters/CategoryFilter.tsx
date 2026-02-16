import { useMindverseStore } from '../../store/mindverseStore';
import type { Category } from '../../types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../data/mockData';

const categories: Category[] = [
  'HEALTH',
  'WORK',
  'LOVE',
  'FAMILY',
  'FINANCES',
  'PERSONAL_GROWTH',
  'LEISURE',
  'SPIRITUALITY',
  'SOCIAL',
];

export default function CategoryFilter() {
  const activeCategoryFilter = useMindverseStore(
    (state) => state.activeCategoryFilter
  );
  const setCategoryFilter = useMindverseStore((state) => state.setCategoryFilter);

  return (
    <div className="bg-slate-800 rounded-xl p-3 shadow-lg border border-slate-700">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Categorías
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            activeCategoryFilter === 'ALL'
              ? 'bg-white text-slate-900 shadow-lg'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeCategoryFilter === category
                ? 'text-white shadow-lg'
                : 'hover:opacity-90'
            }`}
            style={{
              backgroundColor:
                activeCategoryFilter === category
                  ? CATEGORY_COLORS[category]
                  : `${CATEGORY_COLORS[category]}30`,
              color:
                activeCategoryFilter === category
                  ? 'white'
                  : CATEGORY_COLORS[category],
            }}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>
    </div>
  );
}
