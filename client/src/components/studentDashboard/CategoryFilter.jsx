// src/components/dashboard/CategoryFilter.jsx

/**
 * CategoryFilter component
 * Renders pill-style category filter buttons.
 * Props:
 *  - categories: string[]
 *  - selected: string — currently selected category
 *  - onSelect: (category: string) => void
 */

export default function CategoryFilter({ categories = [], selected, onSelect }) {
  return (
    <section aria-label="Filter by category">
      <ul className="flex flex-wrap gap-2" role="list">
        {categories.map((category) => {
          const isSelected = selected === category;
          return (
            <li key={category}>
              <button
                onClick={() => onSelect?.(category)}
                aria-pressed={isSelected}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer
                  ${isSelected
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500 hover:text-gray-900'
                  }`}
              >
                {category}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
