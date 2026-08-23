import type { TabId } from '@/types';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'coach', label: 'Coach' },
  { id: 'guide', label: 'Guide' },
  { id: 'food', label: 'Food' },
  { id: 'stats', label: 'Streak' },
  { id: 'gallery', label: 'Photos' },
  { id: 'profile', label: 'Profile' },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function Tabs({ active, onChange }: Props) {
  return (
    <nav className="tabs" role="tablist" aria-label="Sections">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-controls={`view-${tab.id}`}
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
