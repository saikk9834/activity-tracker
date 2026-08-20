import { useUnits } from '@/state/useUnits';
import type { Units } from '@/lib/units';

const OPTIONS: { value: Units; label: string; title: string }[] = [
  { value: 'metric', label: 'kg', title: 'Show weights in kilograms' },
  { value: 'imperial', label: 'lb', title: 'Show weights in pounds' },
];

/** Segmented kg/lb switch. Changes display only — weights are stored in kg. */
export function UnitToggle() {
  const { units, setUnits } = useUnits();

  return (
    <div className="units" role="group" aria-label="Weight units">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={units === option.value ? 'on' : ''}
          aria-pressed={units === option.value}
          title={option.title}
          onClick={() => setUnits(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
