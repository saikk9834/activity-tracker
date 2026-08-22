import { useState } from 'react';
import { VideoLinkRow } from '@/components/VideoLinkRow';
import { PLAN } from '@/data/plan';
import { planIndex } from '@/lib/date';
import { formatStoredWeight, localiseIncrements } from '@/lib/units';
import { useTracker } from '@/state/useTracker';
import { useUnits } from '@/state/useUnits';

export function WeekView({ today }: { today: Date }) {
  const { data } = useTracker();
  const { units } = useUnits();
  const todayIndex = planIndex(today);
  const [open, setOpen] = useState<Record<number, boolean>>({ [todayIndex]: true });

  return (
    <>
      <p className="small muted" style={{ marginTop: 4 }}>
        The template repeats every week, all 12 weeks. If life explodes, the priority order is{' '}
        <strong>lifts &gt; interval swims &gt; everything else</strong> — a week with 3 lifts and
        nothing else is a successful week. Tap a weight chip on the Today tab to update it as you
        progress, and use <strong>+ add video</strong> under any exercise to attach a form-check
        link — it opens with one tap mid-workout.
      </p>

      <div>
        {PLAN.map((day, i) => (
          <details
            key={day.name}
            className={`day${i === todayIndex ? ' today-hl' : ''}`}
            open={open[i] ?? false}
            onToggle={(e) => {
              // Read before the updater runs — currentTarget is null by then.
              const isOpen = e.currentTarget.open;
              setOpen((prev) => ({ ...prev, [i]: isOpen }));
            }}
          >
            <summary>
              <span className="dn">{day.name.slice(0, 3)}</span>
              <span className="dt">{day.title}</span>
              <span className={`tag ${day.tag}`}>{day.tagLabel}</span>
              <span className="dd">{day.duration}</span>
            </summary>
            <div className="inner">
              <ul className="exlist">
                {day.items.map((item) => {
                  const stored = item.weight ? (data.weights[item.id] ?? item.weight) : null;
                  const weight = stored && formatStoredWeight(stored, units);
                  return (
                    <li key={item.id}>
                      <div className="xtop">
                        <span>
                          {item.name}{' '}
                          {weight && (
                            <span className="mono small" style={{ color: 'var(--accent-ink)' }}>
                              {weight}
                            </span>
                          )}
                        </span>
                        <span className="d">{item.detail}</span>
                      </div>
                      <VideoLinkRow exerciseId={item.id} />
                    </li>
                  );
                })}
              </ul>
              {day.progression && (
                <div className="prog-note">{localiseIncrements(day.progression, units)}</div>
              )}
              <p className="plan-note">{day.note}</p>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
