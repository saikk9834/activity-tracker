import { DEFAULT_PROFILE } from '@/data/profileDefaults';
import { bodyNumbers, formatNumber } from '@/lib/body';
import { displayWeight, weightRange, weightValue } from '@/lib/units';
import { useTracker } from '@/state/useTracker';
import { useUnits } from '@/state/useUnits';
import type { TabId } from '@/types';

/** Falls back to the plan's original figures until a profile is saved. */
const FALLBACK = bodyNumbers(DEFAULT_PROFILE)!;

export function GuideView({ onOpenProfile }: { onOpenProfile: (tab: TabId) => void }) {
  const { data } = useTracker();
  const { units } = useUnits();
  const profile = data.profile;
  const numbers = (profile && bodyNumbers(profile)) ?? FALLBACK;
  const personalised = profile !== null && bodyNumbers(profile) !== null;
  const heavy = numbers.bmi >= 25;

  return (
    <>
      <div className="card">
        <p className="eyebrow">Your numbers</p>
        <h2>The starting point</h2>
        <div className="tw">
          <table>
            <tbody>
              <tr>
                <td>BMI</td>
                <td className="num">{formatNumber(numbers.bmi)}</td>
                <td className="muted small">
                  {profile?.weightKg && profile.heightCm && personalised
                    ? `${displayWeight(profile.weightKg, units)} at ${formatNumber(profile.heightCm)} cm — ${numbers.bmiCategory}`
                    : `${displayWeight(DEFAULT_PROFILE.weightKg!, units)} at ${formatNumber(DEFAULT_PROFILE.heightCm!)} cm — ${numbers.bmiCategory}`}
                </td>
              </tr>
              <tr>
                <td>Estimated TDEE</td>
                <td className="num">~{numbers.tdee.toLocaleString()} kcal</td>
                <td className="muted small">maintenance burn</td>
              </tr>
              <tr>
                <td>Daily calorie target</td>
                <td className="num">
                  {numbers.calorieLow.toLocaleString()}–{numbers.calorieHigh.toLocaleString()} kcal
                </td>
                <td className="muted small">mild deficit — the recomposition zone</td>
              </tr>
              <tr>
                <td>Daily protein target</td>
                <td className="num">
                  {numbers.proteinLow}–{numbers.proteinHigh} g
                </td>
                <td className="muted small">the non-negotiable number</td>
              </tr>
            </tbody>
          </table>
        </div>
        {!personalised && (
          <p className="small muted">
            These are the plan's starting figures.{' '}
            <button type="button" className="linkbtn" onClick={() => onOpenProfile('profile')}>
              Fill in your profile
            </button>{' '}
            to make them yours.
          </p>
        )}
        <p className="small">
          {heavy
            ? 'The goal is '
            : 'You’re not overweight — you’re under-muscled with fat stored at the belly. The goal is '}
          <strong>recomposition</strong>: losing fat and building muscle at the same time, which
          beginners can absolutely do with a mild deficit and high protein. You cannot spot-reduce
          belly fat: it leaves when overall body fat drops, and it’s the last place to go. Expect
          the waist to move around weeks 8–12, not week 3.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Consistency</p>
        <h2>The five mechanics that keep you going</h2>
        <h3>Shrink the promise, keep the frequency</h3>
        <p className="small">
          Your commitment is <em>“I go to the YMCA on my scheduled days”</em> — not 30 minutes, not
          a specific workout. On a terrible day, 10 minutes counts as a win. You’re training the
          habit of <em>going</em>; intensity is easy to add to a habit that exists.
        </p>
        <h3>Decide once, in the calendar</h3>
        <p className="small">
          Vague plans fail; scheduled ones succeed. The sessions live in your calendar like standup
          meetings. You never decide <em>whether</em> — that decision is already made.
        </p>
        <h3>Stack the habit on your work shutdown</h3>
        <p className="small">
          Close laptop → gym bag already packed by the door → leave immediately. The couch gap
          between work and workout is where the habit dies — eliminate it.
        </p>
        <h3>Never miss twice</h3>
        <p className="small">
          Missing one day is noise. Missing two in a row is the start of a new (bad) habit. A missed
          day must be followed by an attended day, even a 15-minute one.
        </p>
        <h3>Track appearances, not outcomes</h3>
        <p className="small">
          Your metric for the first 12 weeks is X’s per month (aim for 24+ here), not{' '}
          {units === 'metric' ? 'kilograms' : 'pounds'}.
          Weigh twice a week, judge only the 7-day average — daily ±{displayWeight(1, units)} swings are
          water, not fat.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Lifting</p>
        <h2>The progression rule</h2>
        <p className="small">
          This is the entire “how much weight” answer, forever — <strong>double progression</strong>:
        </p>
        <ul className="tight small">
          <li>
            Each exercise has a rep range (e.g. 8–12). When you complete{' '}
            <strong>all sets at the top of the range</strong> with honest form (~2 reps left in the
            tank), add weight next session:{' '}
            <span className="mono">{units === 'metric' ? '+2.5 kg' : '+5 lb'}</span> upper body,{' '}
            <span className="mono">{units === 'metric' ? '+5 kg' : '+10 lb'}</span> leg press and
            machines, next dumbbell up.
          </li>
          <li>The new weight drops you back to ~8 reps. Climb back to 12. Repeat.</li>
          <li>
            If you can’t beat your logbook two sessions in a row, the weight stays. That’s normal.
          </li>
        </ul>
        <h3>Effort dial across the 12 weeks</h3>
        <div className="tw">
          <table>
            <tbody>
              <tr>
                <td className="num">Weeks 1–2</td>
                <td>Stop 3–4 reps short of failure — calibrate, learn form, log every weight</td>
              </tr>
              <tr>
                <td className="num">Weeks 3–6</td>
                <td>Stop 2–3 reps short</td>
              </tr>
              <tr>
                <td className="num">Weeks 7–12</td>
                <td>Stop 1–2 reps short on the last set of each exercise</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Warm-up before every lift: 5 min brisk incline walk, then one light set (~50%) of the
          first two exercises. The starting weights in this app are first guesses for an untrained
          {' '}{displayWeight(82, units)} man — week 1’s job is to correct them and tap the chips to
          save yours.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Swimming</p>
        <h2>Swim days, decoded</h2>
        <p className="small">
          <strong>A length</strong> = one end of the pool to the other, once (~30–45 s for a
          beginner). <strong>A round</strong> = a swim plus the rest after it.{' '}
          <strong>Effort /10</strong>: 4–5 = relaxed, could chat; 7 = breathing hard but recovered
          in ~30 s; 9 = near max — never required.
        </p>
        <p className="small">
          All your swim time is <strong>broken into short pieces with rest</strong> — ten one-length
          swims with rests gives more quality work than ten minutes of sloppy continuous struggle.
          That’s why these sessions are doable even though “swim 30 minutes straight” wasn’t.
        </p>
        <ul className="tight small">
          <li>
            <strong>Tuesday — the workout swim.</strong> Hard on purpose; this is the fat-loss
            engine. Recovered before the rest ends? Swim harder. Rest not enough? Ease off a notch.
          </li>
          <li>
            <strong>Thursday — the recovery swim.</strong> Deliberately the easiest session of the
            week. No counting, no targets — don’t turn it into a second workout; Friday needs fresh
            legs.
          </li>
          <li>
            <strong>Saturday — the pyramid.</strong> Climb 1-2-3-4 lengths and back down at a steady
            6–7/10. The peak quietly grows every 2 weeks, and in a few months “20+ lengths straight”
            falls out of it naturally.
          </li>
        </ul>
        <p className="small muted">
          Scaling any swim: too hard → rest longer or cut rounds (never swim sloppy); too easy →
          shorten rests first, then add rounds. Terrible day → 6 easy lengths and out. The X still
          counts.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Expectations</p>
        <h2>When results arrive</h2>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>What actually happens</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num">Wk 1–2</td>
                <td>
                  Scale may drop {weightRange(1, 2, units)} fast (water, not fat). Sleep improves.
                  Soreness peaks, then
                  fades for good.
                </td>
              </tr>
              <tr>
                <td className="num">Wk 2–3</td>
                <td>Strength jumps session to session. Desk energy noticeably better.</td>
              </tr>
              <tr>
                <td className="num">Wk 4–6</td>
                <td>
                  <em>You</em> see it: leaner face, looser waistband. −{weightValue(1.5, units)} to
                  −{displayWeight(3, units)}; waist −1 to −3 cm.
                </td>
              </tr>
              <tr>
                <td className="num">Wk 8–12</td>
                <td>
                  Others notice. −{weightValue(3, units)} to −{displayWeight(5, units)}, waist −3 to
                  −6 cm, every lift up 30–60%.
                </td>
              </tr>
              <tr>
                <td className="num">Mo 4–6</td>
                <td>Upper abs start ghosting in under good light.</td>
              </tr>
              <tr>
                <td className="num">Mo 6–9</td>
                <td>Full abs territory (~12–14% body fat) if nutrition held ~80%+.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small">
          Two warnings: the scale <strong>will</strong> stall for 1–2 week stretches while the waist
          keeps shrinking — that’s muscle being added under the fat, i.e. the plan working; judge by
          tape measure and photos (same spot, same light, every 2 weeks). And the bottleneck is
          never the workouts — the kitchen decides when you get to see the shape the gym builds.
        </p>
      </div>
    </>
  );
}
