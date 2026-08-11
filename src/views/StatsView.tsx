import { MILESTONES, nextMilestoneAfter } from '@/data/milestones';
import { addDays, daysBetween, formatShortDate, iso, planIndex } from '@/lib/date';
import { bestStreak, currentStreak, totalSessions } from '@/lib/streak';
import { useTracker } from '@/state/useTracker';
import type { ISODate } from '@/types';

const WEEKS = 12;
/** How far back a day stays tappable for retroactive logging. */
const EDITABLE_DAYS = 7;

interface Cell {
  key: ISODate;
  label: string;
  done: boolean;
  future: boolean;
  isToday: boolean;
  editable: boolean;
}

function buildCells(today: Date, done: Record<ISODate, boolean>): Cell[] {
  const monday = addDays(today, -planIndex(today));
  const start = addDays(monday, -7 * (WEEKS - 1)); // 12 columns ending with this week
  const todayKey = iso(today);
  const cells: Cell[] = [];

  for (let w = 0; w < WEEKS; w++) {
    for (let r = 0; r < 7; r++) {
      const d = addDays(start, w * 7 + r);
      const key = iso(d);
      const isToday = key === todayKey;
      const future = d > today && !isToday;
      const isDone = !!done[key];
      cells.push({
        key,
        label: formatShortDate(d) + (isDone ? ' — done' : ''),
        done: isDone,
        future,
        isToday,
        editable: !future && daysBetween(d, today) < EDITABLE_DAYS,
      });
    }
  }
  return cells;
}

export function StatsView({ today }: { today: Date }) {
  const { data, toggleDay } = useTracker();

  const current = currentStreak(data.done, today);
  const best = bestStreak(data.done);
  const total = totalSessions(data.done);
  const next = nextMilestoneAfter(current);
  const pct = next ? Math.min(100, Math.round((current / next.days) * 100)) : 100;
  const cells = buildCells(today, data.done);

  return (
    <>
      <div className="statgrid">
        <div className="stat amber">
          <div className="v">{current}</div>
          <div className="l">Current streak</div>
        </div>
        <div className="stat">
          <div className="v">{best}</div>
          <div className="l">Best streak</div>
        </div>
        <div className="stat">
          <div className="v">{total}</div>
          <div className="l">Total sessions</div>
        </div>
      </div>

      <div className="card nextm">
        {next ? (
          <>
            <p className="eyebrow amberev">Next milestone</p>
            <h2>{next.days}-day streak</h2>
            <div className="bar">
              <i style={{ width: `${pct}%` }} />
            </div>
            <p className="small muted mono">
              {current} / {next.days} days
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow amberev">Milestones</p>
            <h2>You’ve cleared the board. Keep swimming.</h2>
          </>
        )}
      </div>

      <div className="card">
        <p className="eyebrow">Last 12 weeks</p>
        <h2>The calendar of X’s</h2>
        <div className="heat">
          {cells.map((cell) => {
            const className =
              'cell' +
              (cell.done ? ' on' : cell.future ? ' future' : '') +
              (cell.isToday ? ' today' : '') +
              (cell.editable ? ' tappable' : '');
            return cell.editable ? (
              <button
                key={cell.key}
                type="button"
                className={className}
                title={cell.label}
                aria-label={cell.label}
                onClick={() => toggleDay(cell.key)}
              />
            ) : (
              <span key={cell.key} className={className} title={cell.label} />
            );
          })}
        </div>
        <div className="legend">
          <span>
            <i style={{ background: 'var(--accent)' }} />
            done
          </span>
          <span>
            <i style={{ background: 'var(--miss)' }} />
            missed
          </span>
          <span>
            <i style={{ border: '1px dashed var(--line)' }} />
            ahead
          </span>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          Forgot to log? Tap any day from the past week to fix it.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow amberev">Milestones</p>
        <h2>The road</h2>
        <div className="mlist">
          {MILESTONES.map((m) => (
            <span key={m.days} className={`mchip${best >= m.days ? ' hit' : ''}`}>
              {m.days}d{best >= m.days ? ' ✓' : ''}
            </span>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Rebuilt a streak after a break? The milestones fire again — every climb counts.
        </p>
      </div>
    </>
  );
}
